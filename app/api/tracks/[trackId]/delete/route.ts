// do not remove
// app/api/tracks/[trackId]/delete/route.ts

import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DeleteTrackRouteContext = {
	params: Promise<{
		trackId: string;
	}>;
};

async function deleteFileIfSafe(fileKey: string | null) {
	if (!fileKey) return;

	const storageRoot = path.join(process.cwd(), "storage");
	const publicUploadsRoot = path.join(process.cwd(), "public", "uploads");
	const requestedPath = path.join(process.cwd(), fileKey);

	const isProtectedFile = requestedPath.startsWith(storageRoot);
	const isPublicUpload = requestedPath.startsWith(publicUploadsRoot);

	if (!isProtectedFile && !isPublicUpload) return;

	try {
		await fs.unlink(requestedPath);
	} catch (error) {
		console.warn(`Could not delete file: ${fileKey}`, error);
	}
}

export async function DELETE(
	_req: NextRequest,
	{ params }: DeleteTrackRouteContext,
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { trackId } = await params;

		const track = await prisma.track.findUnique({
			where: {
				id: trackId,
			},
			select: {
				id: true,
				ownerId: true,
				previewMp3Url: true,
				regularWavKey: true,
				fullZipKey: true,
				_count: {
					select: {
						purchases: true,
					},
				},
			},
		});

		if (!track) {
			return NextResponse.json({ error: "Track not found" }, { status: 404 });
		}

		if (track.ownerId !== user.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (track._count.purchases > 0) {
			const unpublishedTrack = await prisma.track.update({
				where: {
					id: track.id,
				},
				data: {
					isPublished: false,
					isForSale: false,
					deletedAt: new Date(),
				},
			});

			return NextResponse.json({
				data: unpublishedTrack,
				mode: "SOFT_DELETE",
				message:
					"Track has existing purchases, so it was removed from the marketplace but buyers can still access their downloads.",
			});
		}

		await prisma.track.delete({
			where: {
				id: track.id,
			},
		});

		await deleteFileIfSafe(track.previewMp3Url);
		await deleteFileIfSafe(track.regularWavKey);
		await deleteFileIfSafe(track.fullZipKey);

		return NextResponse.json({
			mode: "HARD_DELETE",
			message: "Track was permanently deleted.",
		});
	} catch (error) {
		console.error("Track delete error:", error);
		return NextResponse.json(
			{ error: "Failed to delete track" },
			{ status: 500 },
		);
	}
}