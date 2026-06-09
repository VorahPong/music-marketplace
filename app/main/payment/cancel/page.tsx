// don't remove 
// app/main/payment/cancel/page.tsx

import Link from "next/link";

export default function PaymentCancelPage() {
	return (
		<main className="min-h-screen bg-[#F5F0E8] px-6 py-16 text-[#4E3523]">
			<section className="mx-auto max-w-xl rounded-3xl border border-[#D6CFC7] bg-white p-8 text-center shadow-sm">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF8ED] text-3xl">
					↩️
				</div>

				<h1 className="mt-6 text-3xl font-bold">Payment Canceled</h1>

				<p className="mt-3 text-sm leading-6 text-[#4E3523]/70">
					Your PayPal checkout was canceled. No payment was captured and no
					purchase was added to your account.
				</p>

				<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
					<Link
						href="/main"
						className="rounded-full bg-[#4E3523] px-5 py-3 text-sm font-semibold text-[#FAF8ED]"
					>
						Back to Marketplace
					</Link>

					<Link
						href="/main"
						className="rounded-full border border-[#4E3523] px-5 py-3 text-sm font-semibold text-[#4E3523]"
					>
						Try Again
					</Link>
				</div>
			</section>
		</main>
	);
}