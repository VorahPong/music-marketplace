// app/auth/layout.tsx


export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<main className="relative min-h-screen overflow-hidden bg-[#2B1D14] px-4 py-6 text-white sm:px-6 sm:py-8">
			<div className="pointer-events-none absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-[#8A6A52]/25 blur-3xl" />
			<div className="pointer-events-none absolute bottom-[-140px] right-[-120px] h-80 w-80 rounded-full bg-[#EAD9C7]/15 blur-3xl" />
			<div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4E3523]/30 blur-3xl" />

			<div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full items-center justify-center sm:min-h-[calc(100vh-4rem)]">
				<div className="w-full max-w-[440px] sm:max-w-[480px]">
					{children}
				</div>
			</div>
		</main>
	);
}
