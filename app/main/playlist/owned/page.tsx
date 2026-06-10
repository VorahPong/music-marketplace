import Link from "next/link";
import { redirect } from "next/navigation";
import { Music2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TrackFeedList from "@/app/components/TrackFeedList";

// do not remove
// app/main/playlist/owned/page.tsx

export default async function OwnedTracksPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	const purchases = await prisma.trackPurchase.findMany({
		where: {
			userId: user.id,
		},
		orderBy: {
			createdAt: "desc",
		},
		include: {
			track: {
				include: {
					owner: {
						select: {
							id: true,
							name: true,
							handle: true,
						},
					},
					likes: {
						where: { userId: user.id },
						select: { id: true },
					},
					purchases: {
						where: { userId: user.id },
						select: {
							id: true,
							version: true,
						},
					},
					_count: {
						select: {
							likes: true,
							comments: true,
						},
					},
				},
			},
		},
	});

	const uniqueTracksMap = new Map<string, (typeof purchases)[number]["track"]>();

	for (const purchase of purchases) {
		if (!uniqueTracksMap.has(purchase.track.id)) {
			uniqueTracksMap.set(purchase.track.id, purchase.track);
		}
	}

	const ownedTracks = Array.from(uniqueTracksMap.values()).map((track) => {
		const userPurchases = Array.isArray(track.purchases) ? track.purchases : [];
		const isRegularOwned = userPurchases.some(
			(purchase) => purchase.version === "REGULAR" || purchase.version === "FULL",
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
			isOwner: user.id === track.ownerId,
			owner: track.owner,
		};
	});

	return (
		<main className="min-h-screen bg-[#FAF8ED] px-6 py-10 text-[#4E3523]">
			<section className="mx-auto max-w-5xl">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="text-3xl font-bold">Owned Tracks</h1>
						<p className="mt-2 text-[#4E3523]/70">
							All regular WAV and full ZIP versions you have purchased.
						</p>
					</div>

					<Link
						href="/main"
						className="rounded-full bg-[#4E3523] px-5 py-3 text-sm font-semibold text-[#FAF8ED]"
					>
						Browse Marketplace
					</Link>
				</div>

				{ownedTracks.length === 0 ? (
					<div className="mt-10 rounded-3xl border border-[#D6CFC7] bg-white p-8 text-center shadow-sm">
						<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF8ED]">
							<Music2 size={28} />
						</div>
						<h2 className="mt-5 text-xl font-semibold">No owned tracks yet</h2>
						<p className="mt-2 text-sm text-[#4E3523]/70">
							Purchased tracks will show up here with download buttons.
						</p>
					</div>
				) : (
					<div className="mt-8">
						<TrackFeedList tracks={ownedTracks} isGuest={false} />
					</div>
				)}
			</section>
		</main>
	);
}