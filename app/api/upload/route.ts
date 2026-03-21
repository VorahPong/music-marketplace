import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
		}

		const formData = await req.formData();

		const title = formData.get("title") as string | null;
		const description = formData.get("description") as string | null;
		const file = formData.get("file") as File | null;

		if (!title || !file) {
			return NextResponse.json(
				{ error: "Title and audio file are required." },
				{ status: 400 },
			);
		}

		const allowedTypes = ["audio/mpeg", "audio/wav", "audio/x-wav"];
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{ error: "Only MP3 and WAV files are allowed." },
				{ status: 400 },
			);
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		const originalName = file.name.replace(/\s+/g, "-");
		const fileExtension = path.extname(originalName);
		const uniqueFileName = `${uuidv4()}${fileExtension}`;

		const uploadDir = path.join(process.cwd(), "public", "uploads", "audio");
		await mkdir(uploadDir, { recursive: true });

		const fullFilePath = path.join(uploadDir, uniqueFileName);
		await writeFile(fullFilePath, buffer);

		const fileUrl = `/uploads/audio/${uniqueFileName}`;

		const track = await prisma.track.create({
			data: {
				title: title.trim(),
				description: description?.trim() || null,
				fileUrl,
				fileType: file.type,
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
