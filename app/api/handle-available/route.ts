import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const handle = searchParams.get("handle");

		if (!handle) {
			return NextResponse.json(
				{ error: "Handle is required." },
				{ status: 400 },
			);
		}

		const normalized = handle.toLowerCase();

		const existing = await prisma.user.findUnique({
			where: { handle: normalized },
		});

		return NextResponse.json({
			available: !existing,
		});
	} catch (error) {
		console.error("Handle check error:", error);

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
