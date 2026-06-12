import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
	checkRateLimit,
	createRateLimitKey,
	rateLimitResponse,
} from "@/lib/rateLimit";
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
const ALLOWED_WAV_TYPES = ["audio/wav", "audio/x-wav", "audio/wave"];
const ALLOWED_ZIP_TYPES = ["application/zip", "application/x-zip-compressed"];

function sanitizeFileName(fileName: string) {
	return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getFileExtension(fileName: string) {
	return path.extname(fileName).toLowerCase();
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
	return Number.isInteger(priceCents) && priceCents > 0 && priceCents <= MAX_PRICE_CENTS;
}

function canUploadTracks(role: string) {
	return role === "SELLER" || role === "ADMIN";
}

async function saveFile(file: File, uploadDir: string) {
	const bytes = await file.arrayBuffer();
	const buffer = Buffer.from(bytes);

	const originalName = sanitizeFileName(file.name);
	const fileExtension = getFileExtension(originalName);
	const uniqueFileName = `${uuidv4()}${fileExtension}`;

	await mkdir(uploadDir, { recursive: true });

	const fullFilePath = path.join(uploadDir, uniqueFileName);
	await writeFile(fullFilePath, buffer);

	return uniqueFileName;
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

		const previewMp3File = previewMp3FileRaw instanceof File ? previewMp3FileRaw : null;
		const regularWavFile = regularWavFileRaw instanceof File ? regularWavFileRaw : null;
		const fullZipFile = fullZipFileRaw instanceof File ? fullZipFileRaw : null;

		const cleanTitle = title?.trim() || "";
		const cleanDescription = description?.trim() || null;
		const cleanTimeSignature = timeSignature?.trim() || null;
		const cleanMusicalKey = musicalKey?.trim() || null;

		if (!cleanTitle || !isValidUploadedFile(previewMp3File)) {
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
				{ error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.` },
				{ status: 400 },
			);
		}

		if (cleanTimeSignature && cleanTimeSignature.length > MAX_TIME_SIGNATURE_LENGTH) {
			return NextResponse.json(
				{ error: `Time signature must be ${MAX_TIME_SIGNATURE_LENGTH} characters or fewer.` },
				{ status: 400 },
			);
		}

		if (cleanMusicalKey && cleanMusicalKey.length > MAX_MUSICAL_KEY_LENGTH) {
			return NextResponse.json(
				{ error: `Musical key must be ${MAX_MUSICAL_KEY_LENGTH} characters or fewer.` },
				{ status: 400 },
			);
		}

		if (!isMp3File(previewMp3File)) {
			return NextResponse.json(
				{ error: "Preview file must be an MP3." },
				{ status: 400 },
			);
		}

		if (isFileTooLarge(previewMp3File, MAX_PREVIEW_MP3_SIZE)) {
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

			if (Number.isNaN(parsedBpm) || parsedBpm <= 0 || !Number.isInteger(parsedBpm)) {
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
			if (!isValidUploadedFile(regularWavFile)) {
				return NextResponse.json(
					{ error: "Please upload a WAV file for the regular version." },
					{ status: 400 },
				);
			}

			if (!isWavFile(regularWavFile)) {
				return NextResponse.json(
					{ error: "Regular version must be a WAV file." },
					{ status: 400 },
				);
			}

			if (isFileTooLarge(regularWavFile, MAX_REGULAR_WAV_SIZE)) {
				return NextResponse.json(
					{ error: "Regular WAV file must be 250 MB or smaller." },
					{ status: 400 },
				);
			}

			const regularPriceUsd = Number(regularPriceUsdRaw);

			if (!regularPriceUsdRaw?.trim() || Number.isNaN(regularPriceUsd) || regularPriceUsd <= 0) {
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

			if (isValidUploadedFile(fullZipFile)) {
				if (!isZipFile(fullZipFile)) {
					return NextResponse.json(
						{ error: "Full version must be a ZIP file." },
						{ status: 400 },
					);
				}

				if (isFileTooLarge(fullZipFile, MAX_FULL_ZIP_SIZE)) {
					return NextResponse.json(
						{ error: "Full ZIP file must be 1 GB or smaller." },
						{ status: 400 },
					);
				}

				const fullPriceUsd = Number(fullPriceUsdRaw);

				if (!fullPriceUsdRaw?.trim() || Number.isNaN(fullPriceUsd) || fullPriceUsd <= 0) {
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

		const previewUploadDir = path.join(process.cwd(), "public", "uploads", "previews");
		const regularUploadDir = path.join(process.cwd(), "storage", "protected", "regular");
		const fullUploadDir = path.join(process.cwd(), "storage", "protected", "full");

		const previewFileName = await saveFile(previewMp3File, previewUploadDir);
		const previewMp3Url = `/uploads/previews/${previewFileName}`;

		let regularWavKey: string | null = null;
		let fullZipKey: string | null = null;

		if (isForSale && isValidUploadedFile(regularWavFile)) {
			const regularFileName = await saveFile(regularWavFile, regularUploadDir);
			regularWavKey = `storage/protected/regular/${regularFileName}`;
		}

		if (isForSale && isValidUploadedFile(fullZipFile)) {
			const fullFileName = await saveFile(fullZipFile, fullUploadDir);
			fullZipKey = `storage/protected/full/${fullFileName}`;
		}

		const track = await prisma.track.create({
			data: {
				title: cleanTitle,
				description: cleanDescription,
				previewMp3Url,
				previewFileType: previewMp3File.type || "audio/mpeg",
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
