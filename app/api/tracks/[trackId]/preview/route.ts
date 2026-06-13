// do not remove
// app/api/tracks/[trackId]/preview/route.ts

import { prisma } from "@/lib/prisma";
import { getFileFromStorage } from "@/lib/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteProps = {
	params: Promise<{
		trackId: string;
	}>;
};

function isValidPreviewKey(fileKey: string) {
	if (fileKey.includes("..") || fileKey.startsWith("/") || fileKey.includes("\\")) {
		return false;
	}

	return fileKey.startsWith("previews/");
}

export async function GET(_req: Request, { params }: RouteProps) {
	try {
		const { trackId } = await params;

		const track = await prisma.track.findUnique({
			where: { id: trackId },
			select: {
				id: true,
				previewMp3Url: true,
				previewFileType: true,
				isPublished: true,
				deletedAt: true,
			},
		});

		if (!track || !track.isPublished || track.deletedAt) {
			return NextResponse.json(
				{ error: "Preview not found." },
				{ status: 404 },
			);
		}

		const previewKey = track.previewMp3Url;

		if (!previewKey || !isValidPreviewKey(previewKey)) {
			return NextResponse.json(
				{ error: "Invalid preview file." },
				{ status: 400 },
			);
		}

		const storageFile = await getFileFromStorage(previewKey);
		const fileBytes = await storageFile.Body?.transformToByteArray();

		if (!fileBytes) {
			return NextResponse.json(
				{ error: "Preview file could not be loaded." },
				{ status: 404 },
			);
		}

		const fileBuffer = Buffer.from(fileBytes);

		return new NextResponse(fileBuffer, {
			status: 200,
			headers: {
				"Content-Type": storageFile.ContentType || track.previewFileType || "audio/mpeg",
				"Content-Length": String(storageFile.ContentLength ?? fileBuffer.length),
				"Cache-Control": "public, max-age=300",
				"Accept-Ranges": "bytes",
			},
		});
	} catch (error) {
		console.error("Preview route error:", error);

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}