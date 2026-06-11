// app/auth/layout.tsx

import Link from "next/link";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative min-h-screen overflow-hidden bg-[#2B1D14] px-4 py-10 text-white">
			<div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[#EAD9C7]/20 blur-3xl" />
			<div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-[#FAF8ED]/15 blur-3xl" />
			<div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4E3523]/30 blur-3xl" />

			<div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
				<div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
					<section className="hidden border-r border-white/10 bg-[#4E3523]/40 p-8 lg:flex lg:flex-col lg:justify-between">
						<div>
							<Link
								href="/main"
								className="block overflow-hidden rounded-[2rem] border border-[#EAD9C7]/15 bg-[#4E3523] p-6 shadow-2xl shadow-black/25"
							>
								<img
									src="/icons/musicworld.png"
									alt="Music World logo"
									className="mx-auto h-48 w-full object-contain"
								/>
							</Link>

							<div className="mt-10">
								<p className="mb-4 inline-flex rounded-full border border-[#EAD9C7]/20 bg-[#FAF8ED]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#EAD9C7]">
									Secure access
								</p>
								<h1 className="max-w-md text-4xl font-black leading-tight text-white xl:text-5xl">
									Welcome to OXAMIC&apos;s beat marketplace.
								</h1>
								<p className="mt-5 max-w-md text-sm leading-7 text-[#EAD9C7]/80">
									For now, this website exclusively features OXAMIC&apos;s beats.
									Soon, Music World will allow more sellers to upload, sell, and
									manage their own music.
								</p>
							</div>
						</div>

						<div className="grid gap-3">
							<div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
								<p className="text-sm font-semibold text-white">
									Protected downloads
								</p>
								<p className="mt-2 text-xs leading-5 text-[#EAD9C7]/75">
									Customers get access to purchased WAV and ZIP files only after
									checkout.
								</p>
							</div>
							<div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
								<p className="text-sm font-semibold text-white">
									Receipts and licenses
								</p>
								<p className="mt-2 text-xs leading-5 text-[#EAD9C7]/75">
									Every purchase can include printable proof of payment and
									usage terms.
								</p>
							</div>
						</div>
					</section>

					<section className="relative flex min-h-[680px] items-center justify-center p-5 sm:p-8 lg:p-10">
						<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#EAD9C7]/40 to-transparent lg:hidden" />

						<div className="w-full max-w-md">
							<div className="mb-8 text-center lg:hidden">
								<Link
									href="/main"
									className="inline-flex items-center justify-center gap-3"
								>
									<div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#FAF8ED] p-2">
										<img
											src="/icons/musicworld.png"
											alt="Music World logo"
											className="h-full w-full object-contain"
										/>
									</div>
									<div className="text-left">
										<p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#EAD9C7]">
											Music
										</p>
										<p className="text-xl font-black leading-none text-white">
											World
										</p>
									</div>
								</Link>
							</div>

							{children}
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
