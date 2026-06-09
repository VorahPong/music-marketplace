import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const email = body.email?.trim().toLowerCase();
		const password = body.password?.trim();

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password are required." },
				{ status: 400 },
			);
		}

		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return NextResponse.json(
				{ error: "Invalid email or password." },
				{ status: 401 },
			);
		}

		const isValidPassword = await bcrypt.compare(password, user.passwordHash);

		if (!isValidPassword) {
			return NextResponse.json(
				{ error: "Invalid email or password." },
				{ status: 401 },
			);
		}

		const token = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + authConfig.sessionDurationMs);

		await prisma.session.create({
			data: {
				token,
				userId: user.id,
				expiresAt,
			},
		});

		const cookieStore = await cookies();
		cookieStore.set(authConfig.sessionCookieName, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			expires: expiresAt,
			path: "/",
		});

		return NextResponse.json({
			message: "Login successful.",
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	} catch (error) {
		console.error("Login error:", error);

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
