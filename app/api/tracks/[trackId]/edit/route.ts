// do not remove
// app/api/tracks/[trackId]/edit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { TrackType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStorageKey, deleteFileFromStorage, uploadFileToStorage } from "@/lib/storage";

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

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TIME_SIGNATURE_LENGTH = 20;
const MAX_MUSICAL_KEY_LENGTH = 40;
const MAX_PRICE_CENTS = 100_000;
const MAX_PREVIEW_MP3_SIZE = 20 * 1024 * 1024;
const MAX_REGULAR_WAV_SIZE = 250 * 1024 * 1024;
const MAX_FULL_ZIP_SIZE = 1024 * 1024 * 1024;

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

function getStringValue(value: FormDataEntryValue | null) {
	return typeof value === "string" ? value.trim() : "";
}

function getOptionalFile(value: FormDataEntryValue | null) {
	if (!(value instanceof File) || value.size === 0) return null;
	return value;
}


function getFileExtension(fileName: string) {
	return fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
}

function isFileTooLarge(file: File, maxSize: number) {
	return file.size > maxSize;
}

function isValidStorageKey(fileKey: string | null): fileKey is string {
	if (!fileKey) return false;

	if (fileKey.includes("..") || fileKey.startsWith("/") || fileKey.includes("\\")) {
		return false;
	}

	return (
		fileKey.startsWith("previews/") ||
		fileKey.startsWith("regular/") ||
		fileKey.startsWith("full/")
	);
}

function isValidKeyForFolder(fileKey: string | null, folder: "previews" | "regular" | "full") {
	return Boolean(fileKey && isValidStorageKey(fileKey) && fileKey.startsWith(`${folder}/`));
}

async function deleteOldStorageFile(fileKey: string | null) {
	if (!isValidStorageKey(fileKey)) return;

	try {
		await deleteFileFromStorage(fileKey);
	} catch (error) {
		console.warn(`Could not delete old storage file: ${fileKey}`, error);
	}
}


function isMp3(file: File) {
	return file.type === "audio/mpeg" && getFileExtension(file.name) === ".mp3";
}

function isWav(file: File) {
	return (
		["audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave"].includes(file.type) &&
		getFileExtension(file.name) === ".wav"
	);
}

function isZip(file: File) {
	return (
		["application/zip", "application/x-zip-compressed"].includes(file.type) &&
		getFileExtension(file.name) === ".zip"
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
		const canEditTrack = existingTrack.ownerId === user.id || user.role === "ADMIN";

		if (!canEditTrack) {
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

		const previewMp3Key = getStringValue(formData.get("previewMp3Key")) || null;
		const regularWavKeyFromClient = getStringValue(formData.get("regularWavKey")) || null;
		const fullZipKeyFromClient = getStringValue(formData.get("fullZipKey")) || null;
		const previewFileTypeFromClient = getStringValue(formData.get("previewFileType")) || null;

		const hasPreviewKey = isValidKeyForFolder(previewMp3Key, "previews");
		const hasRegularKey = isValidKeyForFolder(regularWavKeyFromClient, "regular");
		const hasFullKey = isValidKeyForFolder(fullZipKeyFromClient, "full");

		if (!title) {
			return NextResponse.json({ error: "Title is required" }, { status: 400 });
		}

		if (title.length > MAX_TITLE_LENGTH) {
			return NextResponse.json(
				{ error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` },
				{ status: 400 },
			);
		}

		if (description && description.length > MAX_DESCRIPTION_LENGTH) {
			return NextResponse.json(
				{ error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.` },
				{ status: 400 },
			);
		}

		if (timeSignature && timeSignature.length > MAX_TIME_SIGNATURE_LENGTH) {
			return NextResponse.json(
				{ error: `Time signature must be ${MAX_TIME_SIGNATURE_LENGTH} characters or fewer.` },
				{ status: 400 },
			);
		}

		if (musicalKey && musicalKey.length > MAX_MUSICAL_KEY_LENGTH) {
			return NextResponse.json(
				{ error: `Musical key must be ${MAX_MUSICAL_KEY_LENGTH} characters or fewer.` },
				{ status: 400 },
			);
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

		if (previewMp3File && isFileTooLarge(previewMp3File, MAX_PREVIEW_MP3_SIZE)) {
			return NextResponse.json(
				{ error: "Preview MP3 must be 20 MB or smaller." },
				{ status: 400 },
			);
		}

		if (previewMp3Key && !hasPreviewKey) {
			return NextResponse.json(
				{ error: "Invalid preview file key." },
				{ status: 400 },
			);
		}

		if (regularWavFile && !isWav(regularWavFile)) {
			return NextResponse.json(
				{ error: "Regular version must be a WAV file" },
				{ status: 400 },
			);
		}

		if (regularWavFile && isFileTooLarge(regularWavFile, MAX_REGULAR_WAV_SIZE)) {
			return NextResponse.json(
				{ error: "Regular WAV file must be 250 MB or smaller." },
				{ status: 400 },
			);
		}

		if (regularWavKeyFromClient && !hasRegularKey) {
			return NextResponse.json(
				{ error: "Invalid regular WAV file key." },
				{ status: 400 },
			);
		}

		if (fullZipFile && !isZip(fullZipFile)) {
			return NextResponse.json(
				{ error: "Full version must be a ZIP file" },
				{ status: 400 },
			);
		}

		if (fullZipFile && isFileTooLarge(fullZipFile, MAX_FULL_ZIP_SIZE)) {
			return NextResponse.json(
				{ error: "Full ZIP file must be 1 GB or smaller." },
				{ status: 400 },
			);
		}

		if (fullZipKeyFromClient && !hasFullKey) {
			return NextResponse.json(
				{ error: "Invalid full ZIP file key." },
				{ status: 400 },
			);
		}

		if (isForSale) {
			const hasRegularWav = Boolean(existingTrack.regularWavKey || regularWavFile || hasRegularKey);

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

			if (regularPriceCents > MAX_PRICE_CENTS) {
				return NextResponse.json(
					{ error: "Regular price must be between $0.01 and $1,000." },
					{ status: 400 },
				);
			}

			if ((existingTrack.fullZipKey || fullZipFile || hasFullKey) && !fullPriceCents) {
				return NextResponse.json(
					{ error: "Full price is required when a full ZIP exists" },
					{ status: 400 },
				);
			}

			if (fullPriceCents && fullPriceCents > MAX_PRICE_CENTS) {
				return NextResponse.json(
					{ error: "Full version price must be between $0.01 and $1,000." },
					{ status: 400 },
				);
			}
		}

		let previewMp3Url: string | undefined;
		let regularWavKey: string | null | undefined;
		let fullZipKey: string | null | undefined;

		if (previewMp3File) {
			previewMp3Url = createStorageKey("previews", previewMp3File.name);

			await uploadFileToStorage({
				key: previewMp3Url,
				file: previewMp3File,
				contentType: previewMp3File.type || "audio/mpeg",
			});

			await deleteOldStorageFile(existingTrack.previewMp3Url);
		}

		if (!previewMp3File && hasPreviewKey && previewMp3Key) {
			previewMp3Url = previewMp3Key;
			await deleteOldStorageFile(existingTrack.previewMp3Url);
		}

		if (isForSale && regularWavFile) {
			regularWavKey = createStorageKey("regular", regularWavFile.name);

			await uploadFileToStorage({
				key: regularWavKey,
				file: regularWavFile,
				contentType: regularWavFile.type || "audio/wav",
			});

			await deleteOldStorageFile(existingTrack.regularWavKey);
		}

		if (isForSale && !regularWavFile && hasRegularKey && regularWavKeyFromClient) {
			regularWavKey = regularWavKeyFromClient;
			await deleteOldStorageFile(existingTrack.regularWavKey);
		}

		if (isForSale && fullZipFile) {
			fullZipKey = createStorageKey("full", fullZipFile.name);

			await uploadFileToStorage({
				key: fullZipKey,
				file: fullZipFile,
				contentType: fullZipFile.type || "application/zip",
			});

			await deleteOldStorageFile(existingTrack.fullZipKey);
		}

		if (isForSale && !fullZipFile && hasFullKey && fullZipKeyFromClient) {
			fullZipKey = fullZipKeyFromClient;
			await deleteOldStorageFile(existingTrack.fullZipKey);
		}

		if (!isForSale) {
			await deleteOldStorageFile(existingTrack.regularWavKey);
			await deleteOldStorageFile(existingTrack.fullZipKey);
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
				...(previewMp3Url ? { previewMp3Url, previewFileType: previewFileTypeFromClient || "audio/mpeg" } : {}),
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