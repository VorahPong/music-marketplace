import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPayPalAccessToken } from "@/lib/paypal";

const PAYPAL_BASE_URL =
	process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

export async function POST(req: Request) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
		}

		const body = await req.json();
		const trackId = body.trackId as string | undefined;
		const version = body.version as "REGULAR" | "FULL" | undefined;

		if (!trackId) {
			return NextResponse.json(
				{ error: "Track is required." },
				{ status: 400 },
			);
		}

		if (version !== "REGULAR" && version !== "FULL") {
			return NextResponse.json(
				{ error: "Invalid purchase version." },
				{ status: 400 },
			);
		}

		const track = await prisma.track.findUnique({
			where: { id: trackId },
			select: {
				id: true,
				title: true,
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

		if (!track.isPublished || track.deletedAt) {
			return NextResponse.json(
				{ error: "This track is no longer available for purchase." },
				{ status: 400 },
			);
		}

		if (!track.isForSale) {
			return NextResponse.json(
				{ error: "This track is not for sale." },
				{ status: 400 },
			);
		}

		const priceCents =
			version === "REGULAR" ? track.regularPriceCents : track.fullPriceCents;
		const downloadKey =
			version === "REGULAR" ? track.regularWavKey : track.fullZipKey;

		if (!downloadKey || !priceCents || priceCents <= 0) {
			return NextResponse.json(
				{ error: `${version === "REGULAR" ? "Regular" : "Full"} version is not available.` },
				{ status: 400 },
			);
		}

		const existingPurchases = await prisma.trackPurchase.findMany({
			where: {
				userId: user.id,
				trackId: track.id,
			},
			select: {
				version: true,
			},
		});

		const alreadyOwnsRegular = existingPurchases.some(
			(purchase) => purchase.version === "REGULAR" || purchase.version === "FULL",
		);
		const alreadyOwnsFull = existingPurchases.some(
			(purchase) => purchase.version === "FULL",
		);

		if (version === "REGULAR" && alreadyOwnsRegular) {
			return NextResponse.json(
				{ error: "You already own access to the regular version." },
				{ status: 400 },
			);
		}

		if (version === "FULL" && alreadyOwnsFull) {
			return NextResponse.json(
				{ error: "You already own the full version." },
				{ status: 400 },
			);
		}

		const priceUsd = (priceCents / 100).toFixed(2);
		const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

		const accessToken = await getPayPalAccessToken();

		const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({
				intent: "CAPTURE",
				application_context: {
					return_url: `${appUrl}/main/payment/success`,
					cancel_url: `${appUrl}/main/payment/cancel`,
					brand_name: "Music Marketplace",
					user_action: "PAY_NOW",
				},
				purchase_units: [
					{
						amount: {
							currency_code: "USD",
							value: priceUsd,
						},
						description: `${track.title} - ${version === "REGULAR" ? "Regular WAV" : "Full ZIP"}`,
						custom_id: JSON.stringify({
							userId: user.id,
							trackId: track.id,
							version,
							amountCents: priceCents,
						}),
						invoice_id: `${track.id}-${user.id}-${version}`,
					},
				],
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			console.error("PayPal create order error:", data);
			return NextResponse.json(
				{ error: "Failed to create PayPal order." },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			orderId: data.id,
			links: data.links,
		});
	} catch (error) {
		console.error("Create order route error:", error);
		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
