// lib/rateLimit.ts

import { NextResponse } from "next/server";

type RateLimitOptions = {
	key: string;
	limit: number;
	windowMs: number;
};

type RateLimitRecord = {
	count: number;
	resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();

function cleanupExpiredRecords(now: number) {
	for (const [key, record] of rateLimitStore.entries()) {
		if (record.resetAt <= now) {
			rateLimitStore.delete(key);
		}
	}
}

export function getClientIp(req: Request) {
	const forwardedFor = req.headers.get("x-forwarded-for");

	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() || "unknown";
	}

	return (
		req.headers.get("x-real-ip") ||
		req.headers.get("cf-connecting-ip") ||
		req.headers.get("true-client-ip") ||
		"unknown"
	);
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
	const now = Date.now();
	cleanupExpiredRecords(now);

	const existing = rateLimitStore.get(key);

	if (!existing || existing.resetAt <= now) {
		const resetAt = now + windowMs;

		rateLimitStore.set(key, {
			count: 1,
			resetAt,
		});

		return {
			limited: false,
			remaining: Math.max(limit - 1, 0),
			resetAt,
			retryAfterSeconds: Math.ceil((resetAt - now) / 1000),
		};
	}

	if (existing.count >= limit) {
		return {
			limited: true,
			remaining: 0,
			resetAt: existing.resetAt,
			retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
		};
	}

	existing.count += 1;
	rateLimitStore.set(key, existing);

	return {
		limited: false,
		remaining: Math.max(limit - existing.count, 0),
		resetAt: existing.resetAt,
		retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
	};
}

export function rateLimitResponse(retryAfterSeconds: number) {
	return NextResponse.json(
		{
			error: "Too many requests. Please wait a moment and try again.",
			retryAfterSeconds,
		},
		{
			status: 429,
			headers: {
				"Retry-After": String(retryAfterSeconds),
			},
		},
	);
}

export function createRateLimitKey(req: Request, scope: string, identifier?: string) {
	const ip = getClientIp(req);
	const normalizedIdentifier = identifier?.trim().toLowerCase();

	if (normalizedIdentifier) {
		return `${scope}:${ip}:${normalizedIdentifier}`;
	}

	return `${scope}:${ip}`;
}