// app/api/auth/reset-password/route.ts

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
		const email = String(body.email ?? "").trim().toLowerCase();
		const code = String(body.code ?? "").trim();
		const password = String(body.password ?? "");

		if (!email || !code || !password) {
			return NextResponse.json(
				{ error: "Email, code, and new password are required." },
				{ status: 400 },
			);
		}

		const rateLimit = checkRateLimit({
			key: createRateLimitKey(req, "reset-password", email),
			limit: 8,
			windowMs: 15 * 60 * 1000,
		});

		if (rateLimit.limited) {
			return rateLimitResponse(rateLimit.retryAfterSeconds);
		}

		if (!/^\d{6}$/.test(code)) {
			return NextResponse.json(
				{ error: "Reset code must be 6 digits." },
				{ status: 400 },
			);
		}

		if (password.length < 8) {
			return NextResponse.json(
				{ error: "Password must be at least 8 characters." },
				{ status: 400 },
			);
		}

		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
			},
		});

		if (!user) {
			return NextResponse.json(
				{ error: "Invalid or expired reset code." },
				{ status: 400 },
			);
		}

		const authCode = await prisma.authCode.findFirst({
			where: {
				userId: user.id,
				purpose: "RESET_PASSWORD",
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
				{ error: "Invalid or expired reset code." },
				{ status: 400 },
			);
		}

		const isCodeValid = await bcrypt.compare(code, authCode.codeHash);

		if (!isCodeValid) {
			return NextResponse.json(
				{ error: "Invalid or expired reset code." },
				{ status: 400 },
			);
		}

		const passwordHash = await bcrypt.hash(password, 10);

		await prisma.$transaction([
			prisma.user.update({
				where: { id: user.id },
				data: {
					passwordHash,
				},
			}),
			prisma.authCode.deleteMany({
				where: {
					userId: user.id,
					purpose: "RESET_PASSWORD",
				},
			}),
			prisma.session.deleteMany({
				where: {
					userId: user.id,
				},
			}),
		]);

		return NextResponse.json({
			message: "Password reset successfully. Please log in with your new password.",
		});
	} catch (error) {
		console.error("Reset password error:", error);
		return NextResponse.json(
			{ error: "Unable to reset password. Please try again." },
			{ status: 500 },
		);
	}
}