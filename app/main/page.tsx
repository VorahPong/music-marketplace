import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TrackFeedList from "../components/TrackFeedList";

// Do not remove
// app/main/page.tsx

type HomePageProps = {
	searchParams?: Promise<{
		q?: string;
	}>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
	const user = await getCurrentUser();
	const resolvedSearchParams = await searchParams;
	const rawSearchQuery = resolvedSearchParams?.q?.trim() ?? "";
	const searchQuery =
		rawSearchQuery.length >= 2 ? rawSearchQuery.slice(0, 80) : "";

	const tracks = await prisma.track.findMany({
		where: searchQuery
			? {
					title: {
						contains: searchQuery,
						mode: "insensitive",
					},
				}
			: undefined,
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
			_count: {
				select: {
					likes: true,
					comments: true,
				},
			},
			likes: user
				? {
						where: {
							userId: user.id,
						},
						select: { id: true },
					}
				: false,
			purchases: user
				? {
						where: { userId: user.id },
						select: {
							id: true,
							version: true,
						},
					}
				: false,
		},
	});

	const feedTracks = tracks.map((track) => {
		const userPurchases = Array.isArray(track.purchases) ? track.purchases : [];
		const isRegularOwned = userPurchases.some(
			(purchase) =>
				purchase.version === "REGULAR" || purchase.version === "FULL",
		);
		const isFullOwned = userPurchases.some(
			(purchase) => purchase.version === "FULL",
		);

		return {
			id: track.id,
			title: track.title,
			description: track.description,
			previewMp3Url: track.previewMp3Url,
			previewFileType: track.previewFileType,
			regularWavKey: track.regularWavKey,
			fullZipKey: track.fullZipKey,
			trackType: track.trackType,
			bpm: track.bpm,
			timeSignature: track.timeSignature,
			musicalKey: track.musicalKey,
			createdAt: track.createdAt,
			likesCount: track._count.likes,
			commentCount: track._count.comments,
			isLiked: Array.isArray(track.likes) ? track.likes.length > 0 : false,
			isForSale: track.isForSale,
			regularPriceCents: track.regularPriceCents,
			fullPriceCents: track.fullPriceCents,
			isRegularOwned,
			isFullOwned,
			isOwned: isRegularOwned || isFullOwned,
			isOwner: user?.id === track.ownerId,
			owner: track.owner,
		};
	});

	return (
		<div className="min-h-screen bg-[#FAF8ED] text-[#4E3523]">
			<div className="px-6 py-10">
				<div className="mx-auto max-w-5xl">
					<h1 className="text-3xl font-bold">
						{rawSearchQuery && rawSearchQuery.length < 2
							? "Search needs at least 2 characters"
							: searchQuery
								? `Search results for "${searchQuery}"`
								: "Latest Music"}
					</h1>
					<p className="mt-2 text-[#4E3523]/70">
						{rawSearchQuery && rawSearchQuery.length < 2
							? "Please enter at least 2 characters to search by title."
							: searchQuery
								? "Showing tracks with titles that match your search."
								: "Discover newly uploaded tracks from creators."}
					</p>

					{tracks.length === 0 ? (
						<div className="mt-10 rounded-2xl border border-[#D6CFC7] bg-white p-6 text-center">
							<p className="text-lg font-medium">
								{searchQuery ? "No tracks found" : "No tracks uploaded yet"}
							</p>
							<p className="mt-2 text-sm text-[#4E3523]/70">
								{searchQuery
									? "Try searching another title."
									: "Once users upload music, it will appear here."}
							</p>
						</div>
					) : (
						<TrackFeedList tracks={feedTracks} isGuest={!user} />
					)}
				</div>
			</div>
		</div>
	);
}
