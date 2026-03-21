import { prisma } from "@/lib/prisma";
import NavigationBar from "./components/NavigationBar";
import { getCurrentUser } from "@/lib/auth";


export default async function HomePage() {
	const user = await getCurrentUser();
	const tracks = await prisma.track.findMany({
		orderBy: {
			createdAt: "desc",
		},
	});

return (
	<div className="min-h-screen bg-[#FAF8ED] text-[#4E3523]">
		{/* Top Nav */}
		<NavigationBar user={user} />

		{/* Page Content */}
		<div className="px-6 py-10">
			<div className="mx-auto max-w-6xl">
				<h1 className="text-3xl font-bold">Latest Music</h1>
				<p className="mt-2 text-[#4E3523]/70">
					Discover newly uploaded tracks from creators.
				</p>

				{tracks.length === 0 ? (
					<div className="mt-10 rounded-2xl border border-[#D6CFC7] bg-white p-6 text-center">
						<p className="text-lg font-medium">No tracks uploaded yet</p>
						<p className="mt-2 text-sm text-[#4E3523]/70">
							Once users upload music, it will appear here.
						</p>
					</div>
				) : (
					<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{tracks.map((track) => (
							<div
								key={track.id}
								className="rounded-2xl border border-[#D6CFC7] bg-white p-5 shadow-sm"
							>
								<div className="mb-4">
									<h2 className="text-lg font-semibold">{track.title}</h2>
									<p className="mt-1 text-sm text-[#4E3523]/70">
										{track.description || "No description"}
									</p>
								</div>

								<div className="mb-4">
									<span className="inline-block rounded-full bg-[#FAF8ED] px-3 py-1 text-xs font-medium text-[#4E3523]">
										{track.fileType}
									</span>
								</div>

								<audio controls className="w-full">
									<source src={track.fileUrl} />
								</audio>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	</div>
);
}