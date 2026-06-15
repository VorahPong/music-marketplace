// app/api/auth/verify-register-code/route.ts

import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

		const verifyRegisterRateLimit = checkRateLimit({
			key: createRateLimitKey(req, "verify-register-code", email),
			limit: 8,
			windowMs: 15 * 60 * 1000,
		});

		if (verifyRegisterRateLimit.limited) {
			return rateLimitResponse(verifyRegisterRateLimit.retryAfterSeconds);
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
				email: true,
				emailVerifiedAt: true,
			},
		});

		if (!user) {
			return NextResponse.json(
				{ error: "Invalid verification request." },
				{ status: 404 },
			);
		}

		if (user.emailVerifiedAt) {
			return NextResponse.json({
				message: "Email is already verified.",
				verified: true,
			});
		}

		const authCode = await prisma.authCode.findFirst({
			where: {
				userId: user.id,
				purpose: "REGISTER",
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

		await prisma.$transaction([
			prisma.user.update({
				where: {
					id: user.id,
				},
				data: {
					emailVerifiedAt: new Date(),
				},
			}),
			prisma.authCode.deleteMany({
				where: {
					userId: user.id,
					purpose: "REGISTER",
				},
			}),
		]);

		return NextResponse.json({
			message: "Email verified successfully. You can now log in.",
			verified: true,
		});
	} catch (error) {
		console.error("Verify register code error:", error);

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}