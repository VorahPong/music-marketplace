import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPayPalAccessToken } from "@/lib/paypal";
import {
	checkRateLimit,
	createRateLimitKey,
	rateLimitResponse,
} from "@/lib/rateLimit";
// do not remove
// app/api/paypal/capture-order/route.ts
const PAYPAL_BASE_URL =
	process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

const PAYPAL_ORDER_ID_PATTERN = /^[A-Z0-9-]{8,64}$/;

type PayPalCustomId = {
	userId: string;
	trackId: string;
	version: "REGULAR" | "FULL";
	amountCents: number;
};

function createReceiptNumber({
	userId,
	trackId,
	version,
}: {
	userId: string;
	trackId: string;
	version: "REGULAR" | "FULL";
}) {
	return `RCPT-${trackId.slice(-8).toUpperCase()}-${userId.slice(-8).toUpperCase()}-${version}`;
}

function getCaptureAmountCents(capture: any) {
	const value = capture?.amount?.value;
	const currencyCode = capture?.amount?.currency_code;

	if (currencyCode !== "USD" || typeof value !== "string") {
		return null;
	}

	const amount = Number(value);

	if (Number.isNaN(amount) || amount <= 0) {
		return null;
	}

	return Math.round(amount * 100);
}

export async function POST(req: Request) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
		}

		const captureRateLimit = checkRateLimit({
			key: createRateLimitKey(req, "paypal-capture", user.id),
			limit: 20,
			windowMs: 15 * 60 * 1000,
		});

		if (captureRateLimit.limited) {
			return rateLimitResponse(captureRateLimit.retryAfterSeconds);
		}

		const body = await req.json();
		const orderId = body.orderId as string | undefined;

		if (!orderId) {
			return NextResponse.json(
				{ error: "Order ID is required." },
				{ status: 400 },
			);
		}

		if (!PAYPAL_ORDER_ID_PATTERN.test(orderId)) {
			return NextResponse.json(
				{ error: "Invalid PayPal order ID." },
				{ status: 400 },
			);
		}

		const accessToken = await getPayPalAccessToken();

		const response = await fetch(
			`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
			},
		);

		const data = await response.json();

		if (!response.ok) {
			console.error("PayPal capture error:", data);
			return NextResponse.json(
				{ error: "Failed to capture PayPal order." },
				{ status: 500 },
			);
		}

		if (data.status !== "COMPLETED") {
			return NextResponse.json(
				{ error: "Payment not completed." },
				{ status: 400 },
			);
		}

		const purchaseUnit = data.purchase_units?.[0];
		const capture = purchaseUnit?.payments?.captures?.[0];
		const customIdRaw = capture?.custom_id;
		const paypalOrderId = data.id || orderId;
		const paypalCaptureId = capture?.id ?? null;
		const capturedAmountCents = getCaptureAmountCents(capture);

		if (!customIdRaw) {
			return NextResponse.json(
				{ error: "Missing PayPal order metadata." },
				{ status: 400 },
			);
		}

		if (!paypalCaptureId) {
			return NextResponse.json(
				{ error: "Missing PayPal capture ID." },
				{ status: 400 },
			);
		}

		if (!capturedAmountCents) {
			return NextResponse.json(
				{ error: "Invalid PayPal capture amount." },
				{ status: 400 },
			);
		}

		let customId: PayPalCustomId;

		try {
			customId = JSON.parse(customIdRaw) as PayPalCustomId;
		} catch {
			return NextResponse.json(
				{ error: "Invalid PayPal order metadata." },
				{ status: 400 },
			);
		}

		if (customId.userId !== user.id) {
			return NextResponse.json(
				{ error: "This PayPal order does not belong to the current user." },
				{ status: 403 },
			);
		}

		if (customId.version !== "REGULAR" && customId.version !== "FULL") {
			return NextResponse.json(
				{ error: "Invalid purchase version." },
				{ status: 400 },
			);
		}

		if (!customId.trackId || !Number.isInteger(customId.amountCents) || customId.amountCents <= 0) {
			return NextResponse.json(
				{ error: "Invalid PayPal order metadata." },
				{ status: 400 },
			);
		}

		const existingCapture = await prisma.trackPurchase.findFirst({
			where: {
				paypalCaptureId,
			},
			select: {
				id: true,
			},
		});

		if (existingCapture) {
			return NextResponse.json(
				{ error: "This PayPal capture has already been processed." },
				{ status: 409 },
			);
		}

		const track = await prisma.track.findUnique({
			where: { id: customId.trackId },
			select: {
				id: true,
				isForSale: true,
				isPublished: true,
				deletedAt: true,
				ownerId: true,
				regularWavKey: true,
				fullZipKey: true,
				regularPriceCents: true,
				fullPriceCents: true,
			},
		});

		if (!track) {
			return NextResponse.json(
				{ error: "Track not found." },
				{ status: 404 },
			);
		}

		if (track.ownerId === user.id) {
			return NextResponse.json(
				{ error: "You cannot buy your own track." },
				{ status: 400 },
			);
		}

		if (!track.isForSale) {
			return NextResponse.json(
				{ error: "This track is not for sale." },
				{ status: 400 },
			);
		}

		if (!track.isPublished || track.deletedAt) {
			return NextResponse.json(
				{ error: "This track is not available for purchase." },
				{ status: 400 },
			);
		}

		const expectedPriceCents =
			customId.version === "REGULAR"
				? track.regularPriceCents
				: track.fullPriceCents;
		const downloadKey =
			customId.version === "REGULAR" ? track.regularWavKey : track.fullZipKey;

		if (!downloadKey || !expectedPriceCents || expectedPriceCents <= 0) {
			return NextResponse.json(
				{ error: `${customId.version === "REGULAR" ? "Regular" : "Full"} version is not available.` },
				{ status: 400 },
			);
		}

		if (customId.amountCents !== expectedPriceCents) {
			return NextResponse.json(
				{ error: "PayPal order amount does not match the current track price." },
				{ status: 400 },
			);
		}

		if (capturedAmountCents !== expectedPriceCents) {
			return NextResponse.json(
				{ error: "Captured PayPal amount does not match the current track price." },
				{ status: 400 },
			);
		}

		const receiptNumber = createReceiptNumber({
			userId: user.id,
			trackId: track.id,
			version: customId.version,
		});

		const purchase = await prisma.trackPurchase.upsert({
			where: {
				userId_trackId_version: {
					userId: user.id,
					trackId: track.id,
					version: customId.version,
				},
			},
			update: {
				receiptNumber,
				paypalOrderId,
				paypalCaptureId,
				licenseType: "STANDARD",
			},
			create: {
				userId: user.id,
				trackId: track.id,
				version: customId.version,
				amountCents: expectedPriceCents,
				receiptNumber,
				paypalOrderId,
				paypalCaptureId,
				licenseType: "STANDARD",
			},
		});

		return NextResponse.json({
			success: true,
			purchase,
		});
	} catch (error) {
		console.error("Capture order route error:", error);
		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
