import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_TRACK_TYPES = ["SONG", "BEAT", "LOOP", "DRUMKIT"] as const;

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
	return ALLOWED_PREVIEW_TYPES.includes(file.type) || file.name.toLowerCase().endsWith(".mp3");
}

function isWavFile(file: File) {
	return ALLOWED_WAV_TYPES.includes(file.type) || file.name.toLowerCase().endsWith(".wav");
}

function isZipFile(file: File) {
	return ALLOWED_ZIP_TYPES.includes(file.type) || file.name.toLowerCase().endsWith(".zip");
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

		if (user.role !== "SELLER") {
			return NextResponse.json(
				{ error: "Only sellers can upload tracks." },
				{ status: 403 },
			);
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
		const previewMp3File = formData.get("previewMp3File") as File | null;
		const regularWavFile = formData.get("regularWavFile") as File | null;
		const fullZipFile = formData.get("fullZipFile") as File | null;

		if (!title?.trim() || !previewMp3File) {
			return NextResponse.json(
				{ error: "Title and preview MP3 are required." },
				{ status: 400 },
			);
		}

		if (!isMp3File(previewMp3File)) {
			return NextResponse.json(
				{ error: "Preview file must be an MP3." },
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
			if (!regularWavFile) {
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

			const regularPriceUsd = Number(regularPriceUsdRaw);

			if (!regularPriceUsdRaw?.trim() || Number.isNaN(regularPriceUsd) || regularPriceUsd <= 0) {
				return NextResponse.json(
					{ error: "Please provide a valid regular price in USD." },
					{ status: 400 },
				);
			}

			regularPriceCents = Math.round(regularPriceUsd * 100);

			if (fullZipFile) {
				if (!isZipFile(fullZipFile)) {
					return NextResponse.json(
						{ error: "Full version must be a ZIP file." },
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
			}
		}

		const previewUploadDir = path.join(process.cwd(), "public", "uploads", "previews");
		const regularUploadDir = path.join(process.cwd(), "storage", "protected", "regular");
		const fullUploadDir = path.join(process.cwd(), "storage", "protected", "full");

		const previewFileName = await saveFile(previewMp3File, previewUploadDir);
		const previewMp3Url = `/uploads/previews/${previewFileName}`;

		let regularWavKey: string | null = null;
		let fullZipKey: string | null = null;

		if (isForSale && regularWavFile) {
			const regularFileName = await saveFile(regularWavFile, regularUploadDir);
			regularWavKey = `storage/protected/regular/${regularFileName}`;
		}

		if (isForSale && fullZipFile) {
			const fullFileName = await saveFile(fullZipFile, fullUploadDir);
			fullZipKey = `storage/protected/full/${fullFileName}`;
		}

		const track = await prisma.track.create({
			data: {
				title: title.trim(),
				description: description?.trim() || null,
				previewMp3Url,
				previewFileType: previewMp3File.type || "audio/mpeg",
				regularWavKey,
				fullZipKey,
				trackType,
				bpm,
				timeSignature: timeSignature?.trim() || null,
				musicalKey: musicalKey?.trim() || null,
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
