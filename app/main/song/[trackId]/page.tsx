import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import CommentForm from "@/app/components/CommentForm";
import TrackFeedItem from "@/app/components/TrackFeedItem";

// app/main/song/[trackId]/page.tsx

type SongPageProps = {
	params: Promise<{
		trackId: string;
	}>;
};

export default async function SongPage({ params }: SongPageProps) {
	const { trackId } = await params;
	const user = await getCurrentUser();

	const track = await prisma.track.findUnique({
		where: {
			id: trackId,
		},
		include: {
			owner: {
				select: {
					id: true,
					name: true,
					email: true,
					handle: true,
				},
			},
			comments: {
				orderBy: {
					createdAt: "desc",
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							handle: true,
						},
					},
				},
			},
			likes: user
				? {
						where: { userId: user.id },
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
			_count: {
				select: {
					likes: true,
					comments: true,
				},
			},
		},
	});

	if (!track) {
		notFound();
	}

	const userPurchases = Array.isArray(track.purchases) ? track.purchases : [];
	const isRegularOwned = userPurchases.some(
		(purchase) => purchase.version === "REGULAR" || purchase.version === "FULL",
	);
	const isFullOwned = userPurchases.some(
		(purchase) => purchase.version === "FULL",
	);

	const playerTrack = {
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
		isLiked: Array.isArray(track.likes) ? track.likes.length > 0 : false,
		commentCount: track._count.comments,
		isForSale: track.isForSale,
		regularPriceCents: track.regularPriceCents,
		fullPriceCents: track.fullPriceCents,
		isRegularOwned,
		isFullOwned,
		isOwned: isRegularOwned || isFullOwned,
		isOwner: user?.id === track.ownerId,
		owner: track.owner
			? {
					name: track.owner.name,
					handle: track.owner.handle,
			  }
			: null,
	};

	return (
		<div className="min-h-screen bg-[#FAF8ED] text-[#4E3523]">
			<div className="px-6 py-10">
				<div className="mx-auto max-w-5xl">
					<div>
						<TrackFeedItem track={playerTrack} isGuest={!user} />

						<div className="mt-8 rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-sm text-[#4E3523]/70">Preview Format</p>
									<span className="mt-2 inline-block rounded-full bg-[#FAF8ED] px-3 py-1 text-xs font-medium text-[#4E3523]">
										MP3 Preview
									</span>
								</div>

								<div>
									<p className="text-sm text-[#4E3523]/70">Versions</p>
									<div className="mt-2 flex flex-wrap gap-2">
										{track.regularWavKey && (
											<span className="inline-block rounded-full bg-[#FAF8ED] px-3 py-1 text-xs font-medium text-[#4E3523]">
												Regular WAV
											</span>
										)}
										{track.fullZipKey && (
											<span className="inline-block rounded-full bg-[#FAF8ED] px-3 py-1 text-xs font-medium text-[#4E3523]">
												Full ZIP
											</span>
										)}
										{!track.regularWavKey && !track.fullZipKey && (
											<span className="inline-block rounded-full bg-[#FAF8ED] px-3 py-1 text-xs font-medium text-[#4E3523]">
												Streaming Only
											</span>
										)}
									</div>
								</div>

								<div className="text-right text-sm text-[#4E3523]/70">
									<p>{track._count.likes} like{track._count.likes !== 1 ? "s" : ""}</p>
									<p>{track._count.comments} comment{track._count.comments !== 1 ? "s" : ""}</p>
								</div>
							</div>

							<div className="mt-8">
								<h2 className="text-xl font-semibold">Description</h2>
								<p className="mt-3 whitespace-pre-line text-[#4E3523]/80">
									{track.description ||
										"No description provided for this song yet."}
								</p>

								{(track.bpm || track.musicalKey || track.timeSignature) && (
									<div className="mt-6">
										<h3 className="text-lg font-semibold">Track Details</h3>
										<div className="mt-3 grid gap-3 sm:grid-cols-3">
											{track.bpm && (
												<div className="rounded-2xl border border-[#D6CFC7] bg-[#FAF8ED] p-4">
													<p className="text-xs font-medium uppercase tracking-wide text-[#4E3523]/60">
														BPM
													</p>
													<p className="mt-1 text-lg font-semibold">{track.bpm}</p>
												</div>
											)}

											{track.musicalKey && (
												<div className="rounded-2xl border border-[#D6CFC7] bg-[#FAF8ED] p-4">
													<p className="text-xs font-medium uppercase tracking-wide text-[#4E3523]/60">
														Key
													</p>
													<p className="mt-1 text-lg font-semibold">{track.musicalKey}</p>
												</div>
											)}

											{track.timeSignature && (
												<div className="rounded-2xl border border-[#D6CFC7] bg-[#FAF8ED] p-4">
													<p className="text-xs font-medium uppercase tracking-wide text-[#4E3523]/60">
														Time Signature
													</p>
													<p className="mt-1 text-lg font-semibold">
														{track.timeSignature}
													</p>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="mt-8 rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<h2 className="text-2xl font-semibold">Comments</h2>
							<span className="text-sm text-[#4E3523]/70">
								{track.comments.length} comment
								{track.comments.length !== 1 ? "s" : ""}
							</span>
						</div>

						{!user && (
							<div className="mt-4 rounded-2xl border border-[#D6CFC7] bg-[#FAF8ED] p-4 text-sm text-[#4E3523]/80">
								<Link href="/auth/login" className="font-medium underline">
									Log in
								</Link>{" "}
								to leave a comment.
							</div>
						)}

						{user && <CommentForm trackId={track.id} />}

						<div className="mt-8 space-y-4">
							{track.comments.length === 0 ? (
								<div className="rounded-2xl border border-[#D6CFC7] bg-[#FAF8ED] p-5 text-center">
									<p className="font-medium">No comments yet</p>
									<p className="mt-2 text-sm text-[#4E3523]/70">
										Start the conversation on this song.
									</p>
								</div>
							) : (
								track.comments.map((comment) => (
									<div
										key={comment.id}
										className="rounded-2xl border border-[#D6CFC7] bg-[#FAF8ED] p-4"
									>
										<div className="flex items-center justify-between gap-4">
											<div>
												<p className="font-medium">
													{comment.user.name || comment.user.email}
												</p>
												<p className="text-xs text-[#4E3523]/60">
													{new Date(comment.createdAt).toLocaleString()}
												</p>
											</div>
										</div>

										<p className="mt-3 text-sm text-[#4E3523]/85">
											{comment.content}
										</p>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}