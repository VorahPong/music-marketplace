"use client";

import { useMemo, useState } from "react";
import {
	PayPalButtons,
	PayPalScriptProvider,
} from "@paypal/react-paypal-js";

const POINT_PACKAGES = [
	{
		id: "starter",
		name: "Starter Pack",
		points: 100,
		price: 5,
		description: "Good for trying out a few beat purchases.",
	},
	{
		id: "creator",
		name: "Creator Pack",
		points: 250,
		price: 10,
		description: "A solid option for active listeners and creators.",
	},
	{
		id: "pro",
		name: "Pro Pack",
		points: 600,
		price: 20,
		description: "Best value if you plan to buy multiple items.",
	},
];

export default function BuyPointsClient({
	currentPoints,
}: {
	currentPoints: number;
}) {
	const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
	const [message, setMessage] = useState("");

	const selectedPackage = useMemo(
		() => POINT_PACKAGES.find((pkg) => pkg.id === selectedPackageId) ?? null,
		[selectedPackageId],
	);

	return (
		<PayPalScriptProvider
			options={{
				clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
				currency: "USD",
				intent: "capture",
			}}
		>
			<div className="min-h-screen bg-[#FAF8ED] px-6 py-10 text-[#4E3523]">
				<div className="mx-auto max-w-5xl">
					<div className="mb-8">
						<h1 className="text-3xl font-bold">Buy Points</h1>
						<p className="mt-2 text-sm text-[#4E3523]/70">
							Purchase points to buy beats, loops, drumkits, or support artists.
						</p>
					</div>

					<div className="mb-8 rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
						<p className="text-sm text-[#4E3523]/70">Your Current Balance</p>
						<h2 className="mt-2 text-4xl font-bold">{currentPoints} points</h2>
					</div>

					<div className="grid gap-6 md:grid-cols-3">
						{POINT_PACKAGES.map((pkg) => {
							const isSelected = selectedPackageId === pkg.id;

							return (
								<button
									key={pkg.id}
									type="button"
									onClick={() => setSelectedPackageId(pkg.id)}
									className={`rounded-3xl border p-6 text-left shadow-sm transition ${
										isSelected
											? "border-[#4E3523] bg-white ring-2 ring-[#4E3523]"
											: "border-[#D6CFC7] bg-white hover:border-[#4E3523]/50"
									}`}
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-sm text-[#4E3523]/70">{pkg.name}</p>
											<h3 className="mt-2 text-3xl font-bold">
												{pkg.points}
											</h3>
											<p className="mt-1 text-sm text-[#4E3523]/70">
												points
											</p>
										</div>

										<div className="rounded-full bg-[#FAF8ED] px-3 py-1 text-sm font-semibold text-[#4E3523]">
											${pkg.price}
										</div>
									</div>

									<p className="mt-4 text-sm text-[#4E3523]/75">
										{pkg.description}
									</p>
								</button>
							);
						})}
					</div>

					<div className="mt-8 rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
						{selectedPackage ? (
							<div className="flex flex-col gap-4">
								<div>
									<p className="text-sm text-[#4E3523]/70">Selected Package</p>
									<h3 className="mt-1 text-2xl font-semibold">
										{selectedPackage.name}
									</h3>
									<p className="mt-1 text-sm text-[#4E3523]/70">
										{selectedPackage.points} points for ${selectedPackage.price}
									</p>
								</div>

								<PayPalButtons
									style={{ layout: "vertical" }}
									createOrder={async () => {
										const response = await fetch("/api/paypal/create-order", {
											method: "POST",
											headers: {
												"Content-Type": "application/json",
											},
											body: JSON.stringify({
												packageId: selectedPackage.id,
											}),
										});

										const data = await response.json();

										if (!response.ok) {
											throw new Error(
												data.error || "Failed to create order.",
											);
										}

										return data.orderId;
									}}
									onApprove={async (data) => {
										const response = await fetch("/api/paypal/capture-order", {
											method: "POST",
											headers: {
												"Content-Type": "application/json",
											},
											body: JSON.stringify({
												orderId: data.orderID,
												packageId: selectedPackage.id,
											}),
										});

										const result = await response.json();

										if (!response.ok) {
											setMessage(result.error || "Payment failed.");
											return;
										}

										setMessage(
											`Success! Added ${result.pointsAdded} points to your account.`,
										);

										window.location.reload();
									}}
									onError={(err) => {
										console.error(err);
										setMessage("Something went wrong with PayPal checkout.");
									}}
								/>

								{message && (
									<div className="rounded-xl border border-[#D6CFC7] bg-[#FAF8ED] px-4 py-3 text-sm">
										{message}
									</div>
								)}
							</div>
						) : (
							<div className="text-sm text-[#4E3523]/70">
								Select a package to continue.
							</div>
						)}
					</div>
				</div>
			</div>
		</PayPalScriptProvider>
	);
}