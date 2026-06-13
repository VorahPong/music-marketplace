import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getFileFromStorage } from "@/lib/storage";
import { NextResponse } from "next/server";

// app/api/tracks/[trackId]/download/route.ts

type RouteProps = {
	params: Promise<{
		trackId: string;
	}>;
};

type DownloadVersion = "REGULAR" | "FULL";

function sanitizeDownloadName(fileName: string) {
	return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getContentType(version: DownloadVersion) {
	return version === "REGULAR" ? "audio/wav" : "application/zip";
}

function isValidStorageKey(fileKey: string, version: DownloadVersion) {
	if (fileKey.includes("..") || fileKey.startsWith("/") || fileKey.includes("\\")) {
		return false;
	}

	return version === "REGULAR"
		? fileKey.startsWith("regular/")
		: fileKey.startsWith("full/");
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

		if (!isValidStorageKey(fileKey, version)) {
			return NextResponse.json(
				{ error: "Invalid file storage key." },
				{ status: 400 },
			);
		}

		const storageFile = await getFileFromStorage(fileKey);
		const fileBytes = await storageFile.Body?.transformToByteArray();

		if (!fileBytes) {
			return NextResponse.json(
				{ error: "File could not be loaded." },
				{ status: 404 },
			);
		}

		const fileBuffer = Buffer.from(fileBytes);
		const extension = version === "REGULAR" ? "wav" : "zip";
		const downloadName = sanitizeDownloadName(`${track.title}-${version.toLowerCase()}.${extension}`);

		return new NextResponse(fileBuffer, {
			status: 200,
			headers: {
				"Content-Type": storageFile.ContentType || getContentType(version),
				"Content-Disposition": `attachment; filename="${downloadName}"`,
				"Content-Length": String(storageFile.ContentLength ?? fileBuffer.length),
			},
		});
	} catch (error) {
		console.error("Download route error:", error);

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
