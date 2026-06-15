// do not remove
// app/main/support/page.tsx

import { Mail, LifeBuoy } from "lucide-react";

export default function SupportPage() {
	return (
		<main className="min-h-screen bg-[#FAF8ED] px-4 py-10 text-[#4E3523]">
			<section className="mx-auto max-w-2xl">
				<div className="rounded-3xl border border-[#D6CFC7] bg-white p-8 text-center shadow-sm">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF8ED] text-[#4E3523]">
						<LifeBuoy size={30} />
					</div>

					<h1 className="mt-6 text-3xl font-bold">Support</h1>

					<p className="mt-3 text-sm leading-6 text-[#4E3523]/70">
						Need help with your account, purchase, download, or anything else?
						Email support at:
					</p>

					<a
						href="mailto:vorahpongm@gmail.com"
						className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4E3523] px-5 py-3 text-sm font-semibold text-[#FAF8ED] hover:opacity-90"
					>
						<Mail size={17} />
						vorahpongm@gmail.com
					</a>

					<p className="mt-5 text-xs text-[#4E3523]/50">
						Please include your account email, track name, and a short description of the issue.
					</p>
				</div>
			</section>
		</main>
	);
}