import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
	checkRateLimit,
	createRateLimitKey,
	rateLimitResponse,
} from "@/lib/rateLimit";
import {
	createStorageKey,
	isValidStorageKey,
	uploadFileToStorage,
} from "@/lib/storage";
// app/api/upload/route.ts
export const runtime = "nodejs";

const ALLOWED_TRACK_TYPES = ["SONG", "BEAT", "LOOP", "DRUMKIT"] as const;

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TIME_SIGNATURE_LENGTH = 20;
const MAX_MUSICAL_KEY_LENGTH = 40;
const MAX_PRICE_CENTS = 100_000;
const MAX_PREVIEW_MP3_SIZE = 20 * 1024 * 1024;
const MAX_REGULAR_WAV_SIZE = 250 * 1024 * 1024;
const MAX_FULL_ZIP_SIZE = 1024 * 1024 * 1024;

const ALLOWED_PREVIEW_TYPES = ["audio/mpeg"];
const ALLOWED_WAV_TYPES = [
	"audio/wav",
	"audio/x-wav",
	"audio/wave",
	"audio/vnd.wave",
];
const ALLOWED_ZIP_TYPES = ["application/zip", "application/x-zip-compressed"];

function getFileExtension(fileName: string) {
	return fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
}

function isMp3File(file: File) {
	return (
		ALLOWED_PREVIEW_TYPES.includes(file.type) &&
		getFileExtension(file.name) === ".mp3"
	);
}

function isWavFile(file: File) {
	return (
		ALLOWED_WAV_TYPES.includes(file.type) &&
		getFileExtension(file.name) === ".wav"
	);
}

function isZipFile(file: File) {
	return (
		ALLOWED_ZIP_TYPES.includes(file.type) &&
		getFileExtension(file.name) === ".zip"
	);
}

function isValidUploadedFile(file: File | null): file is File {
	return file instanceof File && file.size > 0;
}

function isFileTooLarge(file: File, maxSize: number) {
	return file.size > maxSize;
}

function validatePriceCents(priceCents: number) {
	return (
		Number.isInteger(priceCents) &&
		priceCents > 0 &&
		priceCents <= MAX_PRICE_CENTS
	);
}

function canUploadTracks(role: string) {
	return role === "SELLER" || role === "ADMIN";
}

function getStringValue(value: FormDataEntryValue | null) {
	return typeof value === "string" ? value.trim() : "";
}

function isValidKeyForFolder(
	key: string | null,
	folder: "previews" | "regular" | "full",
) {
	return Boolean(key && isValidStorageKey(key, [folder]));
}

export async function POST(req: Request) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
		}

		if (!canUploadTracks(user.role)) {
			return NextResponse.json(
				{ error: "Only sellers and admins can upload tracks." },
				{ status: 403 },
			);
		}

		const uploadRateLimit = checkRateLimit({
			key: createRateLimitKey(req, "upload", user.id),
			limit: 10,
			windowMs: 60 * 60 * 1000,
		});

		if (uploadRateLimit.limited) {
			return rateLimitResponse(uploadRateLimit.retryAfterSeconds);
		}

		const formData = await req.formData();

		const title = formData.get("title") as string | null;
		const description = formData.get("description") as string | null;
		const trackTypeRaw = formData.get("trackType") as string | null;
		const isForSaleRaw = formData.get("isForSale") as string | null;
		const regularPriceUsdRaw = formData.get("regularPriceUsd") as string | null;
		const fullPriceUsdRaw = formData.get("fullPriceUsd") as string | null;
		const bpmRaw = formData.get("bpm") as string | null;
		const timeSignature = formData.get("timeSignature") as string | null;
		const musicalKey = formData.get("musicalKey") as string | null;
		const previewMp3FileRaw = formData.get("previewMp3File");
		const regularWavFileRaw = formData.get("regularWavFile");
		const fullZipFileRaw = formData.get("fullZipFile");

		const previewMp3KeyRaw = getStringValue(formData.get("previewMp3Key"));
		const regularWavKeyRaw = getStringValue(formData.get("regularWavKey"));
		const fullZipKeyRaw = getStringValue(formData.get("fullZipKey"));
		const previewFileTypeRaw = getStringValue(formData.get("previewFileType"));

		const previewMp3File =
			previewMp3FileRaw instanceof File ? previewMp3FileRaw : null;
		const regularWavFile =
			regularWavFileRaw instanceof File ? regularWavFileRaw : null;
		const fullZipFile = fullZipFileRaw instanceof File ? fullZipFileRaw : null;

		const previewMp3KeyFromClient = previewMp3KeyRaw || null;
		const regularWavKeyFromClient = regularWavKeyRaw || null;
		const fullZipKeyFromClient = fullZipKeyRaw || null;

		const cleanTitle = title?.trim() || "";
		const cleanDescription = description?.trim() || null;
		const cleanTimeSignature = timeSignature?.trim() || null;
		const cleanMusicalKey = musicalKey?.trim() || null;

		const hasPreviewFile = isValidUploadedFile(previewMp3File);
		const hasPreviewKey = isValidKeyForFolder(
			previewMp3KeyFromClient,
			"previews",
		);

		if (!cleanTitle || (!hasPreviewFile && !hasPreviewKey)) {
			return NextResponse.json(
				{ error: "Title and preview MP3 are required." },
				{ status: 400 },
			);
		}

		if (cleanTitle.length > MAX_TITLE_LENGTH) {
			return NextResponse.json(
				{ error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` },
				{ status: 400 },
			);
		}

		if (cleanDescription && cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
			return NextResponse.json(
				{
					error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
				},
				{ status: 400 },
			);
		}

		if (
			cleanTimeSignature &&
			cleanTimeSignature.length > MAX_TIME_SIGNATURE_LENGTH
		) {
			return NextResponse.json(
				{
					error: `Time signature must be ${MAX_TIME_SIGNATURE_LENGTH} characters or fewer.`,
				},
				{ status: 400 },
			);
		}

		if (cleanMusicalKey && cleanMusicalKey.length > MAX_MUSICAL_KEY_LENGTH) {
			return NextResponse.json(
				{
					error: `Musical key must be ${MAX_MUSICAL_KEY_LENGTH} characters or fewer.`,
				},
				{ status: 400 },
			);
		}

		if (hasPreviewFile && !isMp3File(previewMp3File)) {
			return NextResponse.json(
				{ error: "Preview file must be an MP3." },
				{ status: 400 },
			);
		}

		if (
			hasPreviewFile &&
			isFileTooLarge(previewMp3File, MAX_PREVIEW_MP3_SIZE)
		) {
			return NextResponse.json(
				{ error: "Preview MP3 must be 20 MB or smaller." },
				{ status: 400 },
			);
		}

		const trackType = (trackTypeRaw?.toUpperCase() || "SONG") as
			| "SONG"
			| "BEAT"
			| "LOOP"
			| "DRUMKIT";

		if (!ALLOWED_TRACK_TYPES.includes(trackType)) {
			return NextResponse.json(
				{ error: "Invalid track type." },
				{ status: 400 },
			);
		}

		let bpm: number | null = null;

		if (bpmRaw?.trim()) {
			const parsedBpm = Number(bpmRaw);

			if (
				Number.isNaN(parsedBpm) ||
				parsedBpm <= 0 ||
				!Number.isInteger(parsedBpm)
			) {
				return NextResponse.json(
					{ error: "Please provide a valid BPM." },
					{ status: 400 },
				);
			}

			bpm = parsedBpm;
		}

		const isForSale = isForSaleRaw === "true";
		let regularPriceCents: number | null = null;
		let fullPriceCents: number | null = null;

		if (isForSale) {
			const hasRegularFile = isValidUploadedFile(regularWavFile);
			const hasRegularKey = isValidKeyForFolder(
				regularWavKeyFromClient,
				"regular",
			);
			const hasFullFile = isValidUploadedFile(fullZipFile);
			const hasFullKey = isValidKeyForFolder(fullZipKeyFromClient, "full");

			if (!hasRegularFile && !hasRegularKey && !hasFullFile && !hasFullKey) {
				return NextResponse.json(
					{ error: "Please upload a WAV file, a ZIP file, or both to list this item for sale." },
					{ status: 400 },
				);
			}

			if (hasRegularFile && !isWavFile(regularWavFile)) {
				return NextResponse.json(
					{ error: "Regular version must be a WAV file." },
					{ status: 400 },
				);
			}

			if (
				hasRegularFile &&
				isFileTooLarge(regularWavFile, MAX_REGULAR_WAV_SIZE)
			) {
				return NextResponse.json(
					{ error: "Regular WAV file must be 250 MB or smaller." },
					{ status: 400 },
				);
			}

			if (hasRegularFile || hasRegularKey) {
				const regularPriceUsd = Number(regularPriceUsdRaw);

				if (
					!regularPriceUsdRaw?.trim() ||
					Number.isNaN(regularPriceUsd) ||
					regularPriceUsd <= 0
				) {
					return NextResponse.json(
						{ error: "Please provide a valid regular price in USD." },
						{ status: 400 },
					);
				}

				regularPriceCents = Math.round(regularPriceUsd * 100);

				if (!validatePriceCents(regularPriceCents)) {
					return NextResponse.json(
						{ error: "Regular price must be between $0.01 and $1,000." },
						{ status: 400 },
					);
				}
			}

			if (hasFullFile && !isZipFile(fullZipFile)) {
				return NextResponse.json(
					{ error: "Full version must be a ZIP file." },
					{ status: 400 },
				);
			}

			if (hasFullFile && isFileTooLarge(fullZipFile, MAX_FULL_ZIP_SIZE)) {
				return NextResponse.json(
					{ error: "Full ZIP file must be 1 GB or smaller." },
					{ status: 400 },
				);
			}

			if (hasFullFile || hasFullKey) {
				const fullPriceUsd = Number(fullPriceUsdRaw);

				if (
					!fullPriceUsdRaw?.trim() ||
					Number.isNaN(fullPriceUsd) ||
					fullPriceUsd <= 0
				) {
					return NextResponse.json(
						{ error: "Please provide a valid full version price in USD." },
						{ status: 400 },
					);
				}

				fullPriceCents = Math.round(fullPriceUsd * 100);

				if (!validatePriceCents(fullPriceCents)) {
					return NextResponse.json(
						{ error: "Full version price must be between $0.01 and $1,000." },
						{ status: 400 },
					);
				}
			}
		}

		let previewMp3Url = previewMp3KeyFromClient;

		if (hasPreviewFile) {
			const previewMp3Key = createStorageKey("previews", previewMp3File.name);

			await uploadFileToStorage({
				key: previewMp3Key,
				file: previewMp3File,
				contentType: previewMp3File.type || "audio/mpeg",
			});

			previewMp3Url = previewMp3Key;
		}

		let regularWavKey: string | null = null;
		let fullZipKey: string | null = null;

		if (isForSale) {
			regularWavKey = regularWavKeyFromClient;
		}

		if (isForSale && isValidUploadedFile(regularWavFile)) {
			regularWavKey = createStorageKey("regular", regularWavFile.name);

			await uploadFileToStorage({
				key: regularWavKey,
				file: regularWavFile,
				contentType: regularWavFile.type || "audio/wav",
			});
		}

		if (isForSale) {
			fullZipKey = fullZipKeyFromClient;
		}

		if (isForSale && isValidUploadedFile(fullZipFile)) {
			fullZipKey = createStorageKey("full", fullZipFile.name);
			await uploadFileToStorage({
				key: fullZipKey,
				file: fullZipFile,
				contentType: fullZipFile.type || "application/zip",
			});
		}
		if (!previewMp3Url) {
			return NextResponse.json(
				{ error: "Preview MP3 is required." },
				{ status: 400 },
			);
		}

		const track = await prisma.track.create({
			data: {
				title: cleanTitle,
				description: cleanDescription,
				previewMp3Url,
				previewFileType: hasPreviewFile
					? previewMp3File.type || "audio/mpeg"
					: previewFileTypeRaw || "audio/mpeg",
				regularWavKey,
				fullZipKey,
				trackType,
				bpm,
				timeSignature: cleanTimeSignature,
				musicalKey: cleanMusicalKey,
				isForSale,
				regularPriceCents,
				fullPriceCents,
				ownerId: user.id,
			},
		});

		return NextResponse.json(
			{
				message: "Upload successful.",
				data: track,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Upload error:", error);

		return NextResponse.json(
			{ error: "Something went wrong during upload." },
			{ status: 500 },
		);
	}
}
