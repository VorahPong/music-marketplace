import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

// app/api/tracks/[trackId]/download/route.ts

type RouteProps = {
	params: Promise<{
		trackId: string;
	}>;
};

type DownloadVersion = "REGULAR" | "FULL";

function getSafeStoragePath(fileKey: string) {
	const storageRoot = path.join(process.cwd(), "storage");
	const requestedPath = path.join(process.cwd(), fileKey);

	if (!requestedPath.startsWith(storageRoot)) {
		throw new Error("INVALID_FILE_PATH");
	}

	return requestedPath;
}

function sanitizeDownloadName(fileName: string) {
	return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getContentType(version: DownloadVersion) {
	return version === "REGULAR" ? "audio/wav" : "application/zip";
}

export async function GET(req: Request, { params }: RouteProps) {
	try {
		const { trackId } = await params;
		const user = await getCurrentUser();
		const url = new URL(req.url);
		const version = url.searchParams.get("version") as DownloadVersion | null;

		if (version !== "REGULAR" && version !== "FULL") {
			return NextResponse.json(
				{ error: "Invalid download version." },
				{ status: 400 },
			);
		}

		if (!user) {
			return NextResponse.json(
				{ error: "You must be logged in to download this track." },
				{ status: 401 },
			);
		}

		const track = await prisma.track.findUnique({
			where: { id: trackId },
			select: {
				id: true,
				title: true,
				isForSale: true,
				ownerId: true,
				regularWavKey: true,
				fullZipKey: true,
			},
		});

		if (!track) {
			return NextResponse.json({ error: "Track not found." }, { status: 404 });
		}

		const isOwner = user.id === track.ownerId;
		const fileKey = version === "REGULAR" ? track.regularWavKey : track.fullZipKey;

		if (!fileKey) {
			return NextResponse.json(
				{ error: `${version === "REGULAR" ? "Regular" : "Full"} version is not available.` },
				{ status: 404 },
			);
		}

		if (!isOwner) {
			if (!track.isForSale) {
				return NextResponse.json(
					{ error: "This track is not available for download." },
					{ status: 403 },
				);
			}

			const purchase = await prisma.trackPurchase.findUnique({
				where: {
					userId_trackId_version: {
						userId: user.id,
						trackId: track.id,
						version,
					},
				},
				select: {
					id: true,
				},
			});

			const ownsFullVersion =
				version === "REGULAR"
					? await prisma.trackPurchase.findUnique({
							where: {
								userId_trackId_version: {
									userId: user.id,
									trackId: track.id,
									version: "FULL",
								},
							},
							select: { id: true },
						})
					: null;

			if (!purchase && !ownsFullVersion) {
				return NextResponse.json(
					{ error: `You do not own the ${version === "REGULAR" ? "regular" : "full"} version of this track.` },
					{ status: 403 },
				);
			}
		}

		const safeFilePath = getSafeStoragePath(fileKey);
		const fileBuffer = await readFile(safeFilePath);
		const extension = version === "REGULAR" ? "wav" : "zip";
		const downloadName = sanitizeDownloadName(`${track.title}-${version.toLowerCase()}.${extension}`);

		return new NextResponse(fileBuffer, {
			status: 200,
			headers: {
				"Content-Type": getContentType(version),
				"Content-Disposition": `attachment; filename="${downloadName}"`,
				"Content-Length": String(fileBuffer.length),
			},
		});
	} catch (error) {
		console.error("Download route error:", error);

		if (error instanceof Error && error.message === "INVALID_FILE_PATH") {
			return NextResponse.json(
				{ error: "Invalid file path." },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
