// app/auth/layout.tsx
export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-[#FAF8ED] text-white flex items-center justify-center px-4">
			<div className="w-full max-w-md">{children}</div>
		</div>
	);
}
