import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const name = body.name?.trim();
		const email = body.email?.trim().toLowerCase();
		const password = body.password?.trim();

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password are required." },
				{ status: 400 },
			);
		}

		if (password.length < 6) {
			return NextResponse.json(
				{ error: "Password must be at least 6 characters." },
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
				name: name || null,
				email,
				passwordHash,
			},
			select: {
				id: true,
				email: true,
				name: true,
			},
		});

		return NextResponse.json(
			{
				message: "Account created successfully.",
				user,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Register error:", error);

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
