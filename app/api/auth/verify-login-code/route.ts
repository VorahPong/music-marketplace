// app/api/auth/verify-login-code/route.ts

import bcrypt from "bcrypt";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";
import {
	checkRateLimit,
	createRateLimitKey,
	rateLimitResponse,
} from "@/lib/rateLimit";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const email = String(body.email ?? "")
			.trim()
			.toLowerCase();
		const code = String(body.code ?? "").trim();

		if (!email || !code) {
			return NextResponse.json(
				{ error: "Email and verification code are required." },
				{ status: 400 },
			);
		}

		const verifyLoginRateLimit = checkRateLimit({
			key: createRateLimitKey(req, "verify-login-code", email),
			limit: 8,
			windowMs: 15 * 60 * 1000,
		});

		if (verifyLoginRateLimit.limited) {
			return rateLimitResponse(verifyLoginRateLimit.retryAfterSeconds);
		}

		if (!/^\d{6}$/.test(code)) {
			return NextResponse.json(
				{ error: "Verification code must be 6 digits." },
				{ status: 400 },
			);
		}

		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				name: true,
				handle: true,
				email: true,
				role: true,
				emailVerifiedAt: true,
			},
		});

		if (!user) {
			return NextResponse.json(
				{ error: "Invalid verification request." },
				{ status: 404 },
			);
		}

		if (!user.emailVerifiedAt) {
			return NextResponse.json(
				{
					error: "Please verify your email before logging in.",
					requiresVerification: true,
					verificationPurpose: "REGISTER",
					email: user.email,
				},
				{ status: 403 },
			);
		}

		const authCode = await prisma.authCode.findFirst({
			where: {
				userId: user.id,
				purpose: "LOGIN",
				usedAt: null,
				expiresAt: {
					gt: new Date(),
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		if (!authCode) {
			return NextResponse.json(
				{ error: "Verification code is expired or invalid." },
				{ status: 400 },
			);
		}

		const codeMatches = await bcrypt.compare(code, authCode.codeHash);

		if (!codeMatches) {
			return NextResponse.json(
				{ error: "Verification code is incorrect." },
				{ status: 400 },
			);
		}

		const token = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + authConfig.sessionDurationMs);

		await prisma.$transaction([
			prisma.session.create({
				data: {
					token,
					userId: user.id,
					expiresAt,
				},
			}),
			prisma.authCode.deleteMany({
				where: {
					userId: user.id,
					purpose: "LOGIN",
				},
			}),
		]);

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
				handle: user.handle,
				email: user.email,
				role: user.role,
			},
		});
	} catch (error) {
		console.error("Verify login code error:", error);

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}