type AuthCardProps = {
	title: string;
	subtitle: string;
	children: React.ReactNode;
};

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
	return (
		<div className="rounded-2xl border border-zinc-800 bg-[#4E3523] p-8 shadow-xl">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">{title}</h1>
				<p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
			</div>

			{children}
		</div>
	);
}
