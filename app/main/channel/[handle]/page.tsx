import TrackFeedItem from "@/app/components/TrackFeedItem";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
// do not remove
// app/main/channel/[handle]/page.tsx
type ChannelPageProps = {
	params: Promise<{
		handle: string;
	}>;
};

export default async function ChannelPage({ params }: ChannelPageProps) {
	const { handle } = await params;
	const currentUser = await getCurrentUser();

	const channelUser = await prisma.user.findUnique({
		where: {
			handle: handle.toLowerCase(),
		},
		include: {
			tracks: {
				where: {
					isPublished: true,
					deletedAt: null,
				},
				orderBy: {
					createdAt: "desc",
				},
				include: {
					owner: {
						select: {
							name: true,
							handle: true,
						},
					},
					likes: {
						where: {
							userId: currentUser?.id ?? "__guest__",
						},
						select: {
							id: true,
						},
					},
					purchases: {
						where: {
							userId: currentUser?.id ?? "__guest__",
						},
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

	if (!channelUser) {
		notFound();
	}

	const isOwnChannel = currentUser?.id === channelUser.id;
	const tracks = channelUser.tracks.map((track) => {
		const regularPurchase = track.purchases.find(
			(purchase) => purchase.version === "REGULAR",
		);
		const fullPurchase = track.purchases.find(
			(purchase) => purchase.version === "FULL",
		);

		return {
			...track,
			likesCount: track._count.likes,
			commentCount: track._count.comments,
			isLiked: track.likes.length > 0,
			isOwner: currentUser?.id === track.ownerId,
			isRegularOwned: Boolean(regularPurchase || fullPurchase),
			isFullOwned: Boolean(fullPurchase),
			regularPurchaseId: regularPurchase?.id ?? fullPurchase?.id ?? null,
			fullPurchaseId: fullPurchase?.id ?? null,
		};
	});

	return (
		<div className="min-h-screen bg-[#FAF8ED] text-[#4E3523]">

			<div className="px-6 py-10">
				<div className="mx-auto max-w-6xl">
					<div className="rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div className="flex items-center gap-4">
								<div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EAD9C7] text-2xl font-bold text-[#4E3523]">
									{channelUser.name?.charAt(0).toUpperCase() ||
										channelUser.email.charAt(0).toUpperCase()}
								</div>

								<div>
									<h1 className="text-3xl font-bold">
										{channelUser.name || "Unnamed Artist"}
									</h1>
									<p className="mt-1 text-sm text-[#4E3523]/70">
										@{channelUser.handle}
									</p>
									<p className="mt-1 text-sm text-[#4E3523]/70">
										{channelUser.email}
									</p>
									<p className="mt-2 text-sm text-[#4E3523]/70">
										{tracks.length} track
										{tracks.length !== 1 ? "s" : ""}
									</p>
								</div>
							</div>

							{isOwnChannel && (
								<div className="rounded-full bg-[#4E3523] px-4 py-2 text-sm font-medium text-[#FAF8ED]">
									Your Channel
								</div>
							)}
						</div>
					</div>

					<div className="mt-8">
						<h2 className="text-2xl font-semibold">Uploaded Music</h2>

						{tracks.length === 0 ? (
							<div className="mt-6 rounded-2xl border border-[#D6CFC7] bg-white p-6 text-center">
								<p className="text-lg font-medium">No tracks uploaded yet</p>
								<p className="mt-2 text-sm text-[#4E3523]/70">
									This artist has not uploaded any music yet.
								</p>
							</div>
						) : (
							<div className="mt-6 grid gap-6">
								{tracks.map((track) => (
									<TrackFeedItem
										key={track.id}
										track={track}
										isGuest={!currentUser}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
