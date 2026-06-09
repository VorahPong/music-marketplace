import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const name = body.name?.trim();
		const handle = body.handle?.trim().toLowerCase();
		const email = body.email?.trim().toLowerCase();
		const password = body.password?.trim();

		if (!handle || !email || !password) {
			return NextResponse.json(
				{ error: "Handle, email, and password are required." },
				{ status: 400 },
			);
		}

		if (password.length < 6) {
			return NextResponse.json(
				{ error: "Password must be at least 6 characters." },
				{ status: 400 },
			);
		}

		const handleRegex = /^[a-z0-9_]+$/;
		if (!handleRegex.test(handle)) {
			return NextResponse.json(
				{
					error:
						"Handle can only contain lowercase letters, numbers, and underscores.",
				},
				{ status: 400 },
			);
		}

		if (handle.length < 3 || handle.length > 20) {
			return NextResponse.json(
				{ error: "Handle must be between 3 and 20 characters." },
				{ status: 400 },
			);
		}

		const existingEmail = await prisma.user.findUnique({
			where: { email },
		});

		if (existingEmail) {
			return NextResponse.json(
				{ error: "An account with this email already exists." },
				{ status: 409 },
			);
		}

		const existingHandle = await prisma.user.findUnique({
			where: { handle },
		});

		if (existingHandle) {
			return NextResponse.json(
				{ error: "Handle is already taken." },
				{ status: 409 },
			);
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				name: name || null,
				handle,
				email,
				passwordHash,
				role: "CUSTOMER",
			},
			select: {
				id: true,
				name: true,
				handle: true,
				email: true,
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
