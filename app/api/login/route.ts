// app/api/login/route.ts

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";
import { sendVerificationCodeEmail } from "@/lib/email";
import {
	checkRateLimit,
	createRateLimitKey,
	rateLimitResponse,
} from "@/lib/rateLimit";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function generateSixDigitCode() {
	return crypto.randomInt(100000, 1000000).toString();
}

async function createLoginCode(userId: string, email: string) {
	const loginCode = generateSixDigitCode();
	const codeHash = await bcrypt.hash(loginCode, 10);
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

	await prisma.authCode.updateMany({
		where: {
			userId,
			purpose: "LOGIN",
			usedAt: null,
		},
		data: {
			usedAt: new Date(),
		},
	});

	await prisma.authCode.create({
		data: {
			userId,
			codeHash,
			purpose: "LOGIN",
			expiresAt,
		},
	});

	await sendVerificationCodeEmail({
		to: email,
		code: loginCode,
		purpose: "LOGIN",
	});

	console.log(`Login verification code for ${email}: ${loginCode}`);
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const email = String(body.email ?? "")
			.trim()
			.toLowerCase();
		const password = String(body.password ?? "").trim();

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password are required." },
				{ status: 400 },
			);
		}

		const loginRateLimit = checkRateLimit({
			key: createRateLimitKey(req, "login", email),
			limit: 10,
			windowMs: 15 * 60 * 1000,
		});

		if (loginRateLimit.limited) {
			return rateLimitResponse(loginRateLimit.retryAfterSeconds);
		}

		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				name: true,
				handle: true,
				email: true,
				passwordHash: true,
				role: true,
				emailVerifiedAt: true,
				twoFactorEnabled: true,
			},
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

		if (user.twoFactorEnabled) {
			const loginCodeRateLimit = checkRateLimit({
				key: createRateLimitKey(req, "login-code", user.email),
				limit: 5,
				windowMs: 15 * 60 * 1000,
			});

			if (loginCodeRateLimit.limited) {
				return rateLimitResponse(loginCodeRateLimit.retryAfterSeconds);
			}

			await createLoginCode(user.id, user.email);

			return NextResponse.json(
				{
					message: "Enter the 6-digit code to finish logging in.",
					requiresTwoFactor: true,
					verificationPurpose: "LOGIN",
					email: user.email,
				},
				{ status: 200 },
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
				handle: user.handle,
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
