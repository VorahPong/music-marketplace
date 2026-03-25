const PAYPAL_BASE_URL =
	process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

export async function getPayPalAccessToken() {
	const clientId = process.env.PAYPAL_CLIENT_ID;
	const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error("Missing PayPal environment variables.");
	}

	const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

	const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
		method: "POST",
		headers: {
			Authorization: `Basic ${auth}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: "grant_type=client_credentials",
	});

	const data = await response.json();

	if (!response.ok) {
		console.error("PayPal token error:", data);
		throw new Error(data.error_description || "Failed to get PayPal token.");
	}

	return data.access_token as string;
}

export function getPointPackage(packageId: string) {
	const packages = {
		starter: { points: 100, price: "5.00", name: "Starter Pack" },
		creator: { points: 250, price: "10.00", name: "Creator Pack" },
		pro: { points: 600, price: "20.00", name: "Pro Pack" },
	} as const;

	return packages[packageId as keyof typeof packages] ?? null;
}
