// app/api/auth/forgot-password/route.ts

import bcrypt from "bcrypt";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/email";
import {
	checkRateLimit,
	createRateLimitKey,
	rateLimitResponse,
} from "@/lib/rateLimit";

function generateSixDigitCode() {
	return crypto.randomInt(100000, 1000000).toString();
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const email = String(body.email ?? "").trim().toLowerCase();

		if (!email) {
			return NextResponse.json({ error: "Email is required." }, { status: 400 });
		}

		const rateLimit = checkRateLimit({
			key: createRateLimitKey(req, "forgot-password", email),
			limit: 5,
			windowMs: 15 * 60 * 1000,
		});

		if (rateLimit.limited) {
			return rateLimitResponse(rateLimit.retryAfterSeconds);
		}

		const safeMessage =
			"If an account exists for that email, a reset code has been sent.";

		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
			},
		});

		if (!user) {
			return NextResponse.json({ message: safeMessage });
		}

		const resetCode = generateSixDigitCode();
		const codeHash = await bcrypt.hash(resetCode, 10);
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

		await prisma.$transaction([
			prisma.authCode.updateMany({
				where: {
					userId: user.id,
					purpose: "RESET_PASSWORD",
					usedAt: null,
				},
				data: {
					usedAt: new Date(),
				},
			}),
			prisma.authCode.create({
				data: {
					userId: user.id,
					codeHash,
					purpose: "RESET_PASSWORD",
					expiresAt,
				},
			}),
		]);

		await sendVerificationCodeEmail({
			to: user.email,
			code: resetCode,
			purpose: "RESET_PASSWORD",
		});

		console.log(`Password reset code for ${user.email}: ${resetCode}`);

		return NextResponse.json({ message: safeMessage });
	} catch (error) {
		console.error("Forgot password error:", error);
		return NextResponse.json(
			{ error: "Unable to send reset code. Please try again." },
			{ status: 500 },
		);
	}
}