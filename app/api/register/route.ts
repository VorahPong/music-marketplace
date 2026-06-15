import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendVerificationCodeEmail } from "@/lib/email";
import {
	checkRateLimit,
	createRateLimitKey,
	rateLimitResponse,
} from "@/lib/rateLimit";

// app/api/register/route.ts

function generateSixDigitCode() {
	return crypto.randomInt(100000, 1000000).toString();
}

async function hashAuthCode(code: string) {
	return bcrypt.hash(code, 10);
}

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

		const registerRateLimit = checkRateLimit({
			key: createRateLimitKey(req, "register", email),
			limit: 5,
			windowMs: 60 * 60 * 1000,
		});

		if (registerRateLimit.limited) {
			return rateLimitResponse(registerRateLimit.retryAfterSeconds);
		}

		if (password.length < 8) {
			return NextResponse.json(
				{ error: "Password must be at least 8 characters." },
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

		const verificationCode = generateSixDigitCode();
		const codeHash = await hashAuthCode(verificationCode);
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

		const user = await prisma.user.create({
			data: {
				name: name || null,
				handle,
				email,
				passwordHash,
				role: "CUSTOMER",
				emailVerifiedAt: null,
				twoFactorEnabled: true,
				authCodes: {
					create: {
						codeHash,
						purpose: "REGISTER",
						expiresAt,
					},
				},
			},
			select: {
				id: true,
				name: true,
				handle: true,
				email: true,
				emailVerifiedAt: true,
			},
		});

		await sendVerificationCodeEmail({
			to: email,
			code: verificationCode,
			purpose: "REGISTER",
		});


		return NextResponse.json(
			{
				message:
					"Account created successfully. Please verify your email with the 6-digit code.",
				requiresVerification: true,
				verificationPurpose: "REGISTER",
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
