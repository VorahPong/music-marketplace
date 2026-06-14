// do not remove
// app/api/storage/create-upload-url/route.ts

import { getCurrentUser } from "@/lib/auth";
import {
	checkRateLimit,
	createRateLimitKey,
	rateLimitResponse,
} from "@/lib/rateLimit";
import {
	createPresignedUploadUrl,
	createStorageKey,
	type StorageFolder,
} from "@/lib/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type UploadKind = "preview" | "regular" | "full";

type UploadRule = {
	folder: StorageFolder;
	maxSize: number;
	extension: string;
	contentTypes: string[];
};

const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
	preview: {
		folder: "previews",
		maxSize: 20 * 1024 * 1024,
		extension: ".mp3",
		contentTypes: ["audio/mpeg"],
	},
	regular: {
		folder: "regular",
		maxSize: 250 * 1024 * 1024,
		extension: ".wav",
		contentTypes: ["audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave"],
	},
	full: {
		folder: "full",
		maxSize: 1024 * 1024 * 1024,
		extension: ".zip",
		contentTypes: ["application/zip", "application/x-zip-compressed"],
	},
};

function canUploadTracks(role: string) {
	return role === "SELLER" || role === "ADMIN";
}

function getFileExtension(fileName: string) {
	return fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
}

function isValidUploadKind(kind: string): kind is UploadKind {
	return kind === "preview" || kind === "regular" || kind === "full";
}

export async function POST(req: Request) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
		}

		if (!canUploadTracks(user.role)) {
			return NextResponse.json(
				{ error: "Only sellers and admins can upload files." },
				{ status: 403 },
			);
		}

		const rateLimit = checkRateLimit({
			key: createRateLimitKey(req, "create-upload-url", user.id),
			limit: 60,
			windowMs: 60 * 60 * 1000,
		});

		if (rateLimit.limited) {
			return rateLimitResponse(rateLimit.retryAfterSeconds);
		}

		const body = await req.json();
		const kind = String(body.kind ?? "").trim();
		const fileName = String(body.fileName ?? "").trim();
		const contentType = String(body.contentType ?? "").trim();
		const size = Number(body.size ?? 0);

		if (!isValidUploadKind(kind)) {
			return NextResponse.json(
				{ error: "Invalid upload type." },
				{ status: 400 },
			);
		}

		const rule = UPLOAD_RULES[kind];

		if (!fileName || !contentType || !Number.isFinite(size) || size <= 0) {
			return NextResponse.json(
				{ error: "File name, content type, and size are required." },
				{ status: 400 },
			);
		}

		if (size > rule.maxSize) {
			return NextResponse.json(
				{ error: "File is too large for this upload type." },
				{ status: 400 },
			);
		}

		if (getFileExtension(fileName) !== rule.extension) {
			return NextResponse.json(
				{ error: `File must be a ${rule.extension.toUpperCase()} file.` },
				{ status: 400 },
			);
		}

		if (!rule.contentTypes.includes(contentType)) {
			return NextResponse.json(
				{ error: "Invalid file content type." },
				{ status: 400 },
			);
		}

		const key = createStorageKey(rule.folder, fileName);
		const uploadUrl = await createPresignedUploadUrl({
			key,
			contentType,
			expiresInSeconds: 5 * 60,
		});

		return NextResponse.json({
			key,
			uploadUrl,
			contentType,
			expiresInSeconds: 5 * 60,
		});
	} catch (error) {
		console.error("Create upload URL error:", error);

		return NextResponse.json(
			{ error: "Unable to create upload URL." },
			{ status: 500 },
		);
	}
}