import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { name, email, password } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password are required." },
				{ status: 400 },
			);
		}

		const existing = await prisma.user.findUnique({
			where: { email },
		});

		if (existing) {
			return NextResponse.json(
				{ error: "User already exists." },
				{ status: 409 },
			);
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				name,
				email,
				passwordHash,
			},
		});

		return NextResponse.json({
			id: user.id,
			email: user.email,
		});
	} catch {
		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
