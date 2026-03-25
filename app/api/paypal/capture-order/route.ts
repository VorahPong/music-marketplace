import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPayPalAccessToken, getPointPackage } from "@/lib/paypal";

const PAYPAL_BASE_URL =
	process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

export async function POST(req: Request) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
		}

		const body = await req.json();
		const orderId = body.orderId as string | undefined;
		const packageId = body.packageId as string | undefined;

		if (!orderId || !packageId) {
			return NextResponse.json(
				{ error: "Order ID and package ID are required." },
				{ status: 400 },
			);
		}

		const selectedPackage = getPointPackage(packageId);

		if (!selectedPackage) {
			return NextResponse.json(
				{ error: "Invalid package selected." },
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

		await prisma.user.update({
			where: { id: user.id },
			data: {
				points: {
					increment: selectedPackage.points,
				},
			},
		});

		return NextResponse.json({
			success: true,
			pointsAdded: selectedPackage.points,
		});
	} catch (error) {
		console.error("Capture order route error:", error);
		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
