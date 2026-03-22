import { prisma } from "@/lib/prisma";
import NavigationBar from "../components/NavigationBar";
import { getCurrentUser } from "@/lib/auth";
import TrackFeedList from "../components/TrackFeedList";

export default async function HomePage() {
	const user = await getCurrentUser();

	const tracks = await prisma.track.findMany({
	orderBy: {
		createdAt: "desc",
	},
	include: {
		owner: {
			select: {
				id: true,
				name: true,
				handle: true,
			},
		},
	},
});

	return (
		<div className="min-h-screen bg-[#FAF8ED] text-[#4E3523]">

			<div className="px-6 py-10">
				<div className="mx-auto max-w-5xl">
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
						<TrackFeedList tracks={tracks} isGuest={!user} />
					)}
				</div>
			</div>
		</div>
	);
}