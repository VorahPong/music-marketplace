"use client";

// don't remove
// app/main/payment/success/page.tsx

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type CaptureStatus = "loading" | "success" | "error";

export default function PaymentSuccessPage() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get("token");
	const hasCapturedRef = useRef(false);
	const [status, setStatus] = useState<CaptureStatus>("loading");
	const [message, setMessage] = useState("Finalizing your payment...");

	useEffect(() => {
		async function captureOrder() {
			if (hasCapturedRef.current) return;
			hasCapturedRef.current = true;

			if (!orderId) {
				setStatus("error");
				setMessage("Missing PayPal order ID. Please contact support if you were charged.");
				return;
			}

			try {
				const response = await fetch("/api/paypal/capture-order", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ orderId }),
				});

				const data = await response.json();

				if (!response.ok) {
					setStatus("error");
					setMessage(data.error || "Payment was approved, but we could not unlock the download.");
					return;
				}

				setStatus("success");
				setMessage("Payment complete. Your download is now unlocked.");
			} catch (error) {
				console.error("Capture payment error:", error);
				setStatus("error");
				setMessage("Something went wrong while finalizing your payment.");
			}
		}

		captureOrder();
	}, [orderId]);

	const isLoading = status === "loading";
	const isSuccess = status === "success";

	return (
		<main className="min-h-screen bg-[#F5F0E8] px-6 py-16 text-[#4E3523]">
			<section className="mx-auto max-w-xl rounded-3xl border border-[#D6CFC7] bg-white p-8 text-center shadow-sm">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF8ED] text-3xl">
					{isLoading ? "⏳" : isSuccess ? "✅" : "⚠️"}
				</div>

				<h1 className="mt-6 text-3xl font-bold">
					{isLoading
						? "Finalizing Payment"
						: isSuccess
							? "Payment Successful"
							: "Payment Needs Attention"}
				</h1>

				<p className="mt-3 text-sm leading-6 text-[#4E3523]/70">{message}</p>

				<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
					<Link
						href="/main"
						className="rounded-full bg-[#4E3523] px-5 py-3 text-sm font-semibold text-[#FAF8ED]"
					>
						Back to Marketplace
					</Link>

					{isSuccess && (
						<Link
							href="/main"
							className="rounded-full border border-[#4E3523] px-5 py-3 text-sm font-semibold text-[#4E3523]"
						>
							Find My Track
						</Link>
					)}
				</div>
			</section>
		</main>
	);
}