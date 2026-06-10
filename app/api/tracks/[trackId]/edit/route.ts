// do not remove
// app/api/tracks/[trackId]/edit/route.ts

import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { TrackType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type EditTrackRouteContext = {
	params: Promise<{
		trackId: string;
	}>;
};

const VALID_TRACK_TYPES = [
	TrackType.SONG,
	TrackType.BEAT,
	TrackType.LOOP,
	TrackType.DRUMKIT,
] as const;

function parseUsdToCents(value: FormDataEntryValue | null) {
	if (typeof value !== "string" || !value.trim()) return null;

	const amount = Number(value);

	if (Number.isNaN(amount) || amount <= 0) return null;

	return Math.round(amount * 100);
}

function getOptionalString(value: FormDataEntryValue | null) {
	if (typeof value !== "string") return null;

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function getOptionalFile(value: FormDataEntryValue | null) {
	if (!(value instanceof File) || value.size === 0) return null;
	return value;
}

function makeSafeFileName(file: File) {
	const fileExtension = path.extname(file.name).toLowerCase();
	const baseName = path
		.basename(file.name, fileExtension)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "") || "track";

	return `${Date.now()}-${crypto.randomUUID()}-${baseName}${fileExtension}`;
}

async function saveFile(file: File, folderPath: string) {
	await fs.mkdir(folderPath, { recursive: true });

	const fileName = makeSafeFileName(file);
	const filePath = path.join(folderPath, fileName);
	const arrayBuffer = await file.arrayBuffer();

	await fs.writeFile(filePath, Buffer.from(arrayBuffer));

	return fileName;
}

function isMp3(file: File) {
	return file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3");
}

function isWav(file: File) {
	return (
		["audio/wav", "audio/x-wav", "audio/wave"].includes(file.type) ||
		file.name.toLowerCase().endsWith(".wav")
	);
}

function isZip(file: File) {
	return (
		["application/zip", "application/x-zip-compressed"].includes(file.type) ||
		file.name.toLowerCase().endsWith(".zip")
	);
}

export async function PATCH(
	req: NextRequest,
	{ params }: EditTrackRouteContext,
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { trackId } = await params;

		const existingTrack = await prisma.track.findUnique({
			where: { id: trackId },
			select: {
				id: true,
				ownerId: true,
				regularWavKey: true,
				fullZipKey: true,
				previewMp3Url: true,
			},
		});

		if (!existingTrack) {
			return NextResponse.json({ error: "Track not found" }, { status: 404 });
		}

		if (existingTrack.ownerId !== user.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const formData = await req.formData();

		const title = getOptionalString(formData.get("title"));
		const description = getOptionalString(formData.get("description"));
		const trackType = getOptionalString(formData.get("trackType"));
		const bpmValue = getOptionalString(formData.get("bpm"));
		const timeSignature = getOptionalString(formData.get("timeSignature"));
		const musicalKey = getOptionalString(formData.get("musicalKey"));
		const isForSale = formData.get("isForSale") === "true";
		const regularPriceCents = parseUsdToCents(formData.get("regularPriceUsd"));
		const fullPriceCents = parseUsdToCents(formData.get("fullPriceUsd"));

		const previewMp3File = getOptionalFile(formData.get("previewMp3File"));
		const regularWavFile = getOptionalFile(formData.get("regularWavFile"));
		const fullZipFile = getOptionalFile(formData.get("fullZipFile"));

		if (!title) {
			return NextResponse.json({ error: "Title is required" }, { status: 400 });
		}

		const parsedTrackType = trackType as TrackType | null;

		if (parsedTrackType && !VALID_TRACK_TYPES.includes(parsedTrackType)) {
			return NextResponse.json({ error: "Invalid track type" }, { status: 400 });
		}

		let bpm: number | null = null;

		if (bpmValue) {
			const parsedBpm = Number(bpmValue);

			if (Number.isNaN(parsedBpm) || parsedBpm <= 0) {
				return NextResponse.json({ error: "Invalid BPM" }, { status: 400 });
			}

			bpm = parsedBpm;
		}

		if (previewMp3File && !isMp3(previewMp3File)) {
			return NextResponse.json(
				{ error: "Preview file must be an MP3" },
				{ status: 400 },
			);
		}

		if (regularWavFile && !isWav(regularWavFile)) {
			return NextResponse.json(
				{ error: "Regular version must be a WAV file" },
				{ status: 400 },
			);
		}

		if (fullZipFile && !isZip(fullZipFile)) {
			return NextResponse.json(
				{ error: "Full version must be a ZIP file" },
				{ status: 400 },
			);
		}

		if (isForSale) {
			const hasRegularWav = Boolean(existingTrack.regularWavKey || regularWavFile);

			if (!hasRegularWav) {
				return NextResponse.json(
					{ error: "Regular WAV file is required for items that are for sale" },
					{ status: 400 },
				);
			}

			if (!regularPriceCents) {
				return NextResponse.json(
					{ error: "Regular price is required for items that are for sale" },
					{ status: 400 },
				);
			}

			if ((existingTrack.fullZipKey || fullZipFile) && !fullPriceCents) {
				return NextResponse.json(
					{ error: "Full price is required when a full ZIP exists" },
					{ status: 400 },
				);
			}
		}

		const publicPreviewFolder = path.join(
			process.cwd(),
			"public",
			"uploads",
			"previews",
		);
		const protectedRegularFolder = path.join(
			process.cwd(),
			"storage",
			"protected",
			"regular",
		);
		const protectedFullFolder = path.join(
			process.cwd(),
			"storage",
			"protected",
			"full",
		);

		let previewMp3Url: string | undefined;
		let regularWavKey: string | null | undefined;
		let fullZipKey: string | null | undefined;

		if (previewMp3File) {
			const savedPreviewName = await saveFile(previewMp3File, publicPreviewFolder);
			previewMp3Url = `/uploads/previews/${savedPreviewName}`;
		}

		if (isForSale && regularWavFile) {
			const savedRegularName = await saveFile(regularWavFile, protectedRegularFolder);
			regularWavKey = `storage/protected/regular/${savedRegularName}`;
		}

		if (isForSale && fullZipFile) {
			const savedFullName = await saveFile(fullZipFile, protectedFullFolder);
			fullZipKey = `storage/protected/full/${savedFullName}`;
		}

		if (!isForSale) {
			regularWavKey = null;
			fullZipKey = null;
		}

		const updatedTrack = await prisma.track.update({
			where: { id: existingTrack.id },
			data: {
				title,
				description,
				trackType: parsedTrackType || TrackType.SONG,
				bpm,
				timeSignature,
				musicalKey,
				isForSale,
				regularPriceCents: isForSale ? regularPriceCents : null,
				fullPriceCents: isForSale ? fullPriceCents : null,
				...(previewMp3Url ? { previewMp3Url, previewFileType: "audio/mpeg" } : {}),
				...(regularWavKey !== undefined ? { regularWavKey } : {}),
				...(fullZipKey !== undefined ? { fullZipKey } : {}),
			},
		});

		return NextResponse.json({ data: updatedTrack });
	} catch (error) {
		console.error("Track update error:", error);
		return NextResponse.json(
			{ error: "Failed to update track" },
			{ status: 500 },
		);
	}
}