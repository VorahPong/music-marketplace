import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPayPalAccessToken } from "@/lib/paypal";

const PAYPAL_BASE_URL =
	process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

type PayPalCustomId = {
	userId: string;
	trackId: string;
	version: "REGULAR" | "FULL";
	amountCents: number;
};

export async function POST(req: Request) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
		}

		const body = await req.json();
		const orderId = body.orderId as string | undefined;

		if (!orderId) {
			return NextResponse.json(
				{ error: "Order ID is required." },
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

		const customIdRaw = data.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;

		if (!customIdRaw) {
			return NextResponse.json(
				{ error: "Missing PayPal order metadata." },
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

		const track = await prisma.track.findUnique({
			where: { id: customId.trackId },
			select: {
				id: true,
				isForSale: true,
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

		const purchase = await prisma.trackPurchase.upsert({
			where: {
				userId_trackId_version: {
					userId: user.id,
					trackId: track.id,
					version: customId.version,
				},
			},
			update: {},
			create: {
				userId: user.id,
				trackId: track.id,
				version: customId.version,
				amountCents: expectedPriceCents,
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
