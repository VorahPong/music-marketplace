import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
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
		const packageId = body.packageId as string | undefined;

		if (!packageId) {
			return NextResponse.json(
				{ error: "Package is required." },
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

		const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({
				intent: "CAPTURE",
				purchase_units: [
					{
						amount: {
							currency_code: "USD",
							value: selectedPackage.price,
						},
						description: `${selectedPackage.name} - ${selectedPackage.points} points`,
						custom_id: JSON.stringify({
							userId: user.id,
							packageId,
							points: selectedPackage.points,
						}),
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

		return NextResponse.json({ orderId: data.id });
	} catch (error) {
		console.error("Create order route error:", error);
		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
