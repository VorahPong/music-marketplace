import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TrackFeedList from "@/app/components/TrackFeedList";

export default async function LikedPlaylistPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	const likedTracks = await prisma.like.findMany({
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
				},
			},
		},
	});

	const feedTracks = likedTracks.map(({ track }) => ({
		id: track.id,
		title: track.title,
		description: track.description,
		fileUrl: track.fileUrl,
		trackType: track.trackType,
		createdAt: track.createdAt,
		likesCount: track._count.likes,
		isLiked: true,
		owner: track.owner,
	}));

	return (
		<div className="min-h-screen bg-[#FAF8ED] px-6 py-10 text-[#4E3523]">
			<div className="mx-auto max-w-6xl">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">Liked Playlist</h1>
					<p className="mt-2 text-sm text-[#4E3523]/70">
						All the tracks you’ve liked in one place.
					</p>
				</div>

				{likedTracks.length === 0 ? (
					<div className="rounded-3xl border border-[#D6CFC7] bg-white p-10 text-center shadow-sm">
						<h2 className="text-xl font-semibold">No liked tracks yet</h2>
						<p className="mt-2 text-sm text-[#4E3523]/70">
							Go explore music and tap the like button on tracks you enjoy.
						</p>

						<Link
							href="/main"
							className="mt-5 inline-block rounded-xl bg-[#4E3523] px-5 py-3 text-sm font-medium text-[#FAF8ED] hover:opacity-90"
						>
							Explore Tracks
						</Link>
					</div>
				) : (
					<TrackFeedList tracks={feedTracks} isGuest={false} />
				)}
			</div>
		</div>
	);
}