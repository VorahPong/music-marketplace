import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TrackFeedList from "../components/TrackFeedList";

// Do not remove
// app/main/page.tsx

type HomePageProps = {
	searchParams?: Promise<{
		q?: string;
		page?: string;
	}>;
};

const TRACKS_PER_PAGE = 12;

export default async function HomePage({ searchParams }: HomePageProps) {
	const user = await getCurrentUser();
	const resolvedSearchParams = await searchParams;
	const rawSearchQuery = resolvedSearchParams?.q?.trim() ?? "";
	const searchQuery =
		rawSearchQuery.length >= 2 ? rawSearchQuery.slice(0, 80) : "";

	const requestedPage = Number(resolvedSearchParams?.page ?? "1");
	const currentPage =
		Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

	const where = {
		isPublished: true,
		deletedAt: null,
		...(searchQuery
			? {
					title: {
						contains: searchQuery,
						mode: "insensitive" as const,
					},
				}
			: {}),
	};

	const [tracks, totalTracks] = await Promise.all([
		prisma.track.findMany({
			where,
			orderBy: {
				createdAt: "desc",
			},
			skip: (currentPage - 1) * TRACKS_PER_PAGE,
			take: TRACKS_PER_PAGE,
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
		}),
		prisma.track.count({ where }),
	]);

	const totalPages = Math.max(1, Math.ceil(totalTracks / TRACKS_PER_PAGE));
	const visibleStart = totalTracks === 0 ? 0 : (currentPage - 1) * TRACKS_PER_PAGE + 1;
	const visibleEnd = Math.min(currentPage * TRACKS_PER_PAGE, totalTracks);

	function getPageHref(page: number) {
		const params = new URLSearchParams();

		if (rawSearchQuery) {
			params.set("q", rawSearchQuery);
		}

		if (page > 1) {
			params.set("page", String(page));
		}

		const queryString = params.toString();
		return queryString ? `/main?${queryString}` : "/main";
	}

	const feedTracks = tracks.map((track) => {
		const isRegularAvailable = Boolean(
			track.regularWavKey &&
				track.regularPriceCents &&
				track.regularPriceCents > 0,
		);
		const isFullAvailable = Boolean(
			track.fullZipKey && track.fullPriceCents && track.fullPriceCents > 0,
		);
		const userPurchases = Array.isArray(track.purchases) ? track.purchases : [];
		const isRegularOwned = userPurchases.some(
			(purchase) =>
				purchase.version === "REGULAR" || purchase.version === "FULL",
		);
		const isFullOwned = userPurchases.some(
			(purchase) => purchase.version === "FULL",
		);

		const regularPurchase = userPurchases.find(
			(purchase) => purchase.version === "REGULAR",
		);
		const fullPurchase = userPurchases.find(
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
			isForSale:
				track.isForSale && (isRegularAvailable || isFullAvailable),
			isRegularAvailable,
			isFullAvailable,
			regularPriceCents: track.regularPriceCents,
			fullPriceCents: track.fullPriceCents,
			isRegularOwned,
			isFullOwned,
			isOwned: isRegularOwned || isFullOwned,
			regularPurchaseId: regularPurchase?.id ?? fullPurchase?.id ?? null,
			fullPurchaseId: fullPurchase?.id ?? null,
			isOwner: user?.id === track.ownerId,
			owner: track.owner,
		};
	});

	const pageTitle =
		rawSearchQuery && rawSearchQuery.length < 2
			? "Search needs at least 2 characters"
			: searchQuery
				? `Search results for "${searchQuery}"`
				: "OXAMIC Beat Marketplace";

	const pageDescription =
		rawSearchQuery && rawSearchQuery.length < 2
			? "Please enter at least 2 characters to search by title."
			: searchQuery
				? "Showing tracks with titles that match your search."
				: "Exclusive beats from OXAMIC for now. Soon, Music World will open the marketplace for more sellers.";

	return (
		<div className="min-h-screen bg-[#FAF8ED] text-[#4E3523]">
			<section className="relative overflow-hidden border-b border-[#D6CFC7] bg-[#2B1D14] text-white">
				<div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[#EAD9C7]/20 blur-3xl" />
				<div className="absolute bottom-[-160px] right-[-120px] h-96 w-96 rounded-full bg-[#FAF8ED]/15 blur-3xl" />
				<div className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4E3523]/40 blur-3xl" />

				<div className="relative mx-auto max-w-6xl px-6 py-8 lg:py-10">
					<div className="grid items-center gap-6 lg:grid-cols-[1.3fr_0.7fr]">
						<div>
							<p className="inline-flex rounded-full border border-[#EAD9C7]/20 bg-[#FAF8ED]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#EAD9C7]">
								Music World Exclusive
							</p>
							<h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-white md:text-4xl">
								{pageTitle}
							</h1>
							<p className="mt-3 max-w-2xl text-sm leading-6 text-[#EAD9C7]/80">
								{pageDescription}
							</p>

							<div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#EAD9C7]">
								<span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
									MP3 Preview
								</span>
								<span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
									WAV Purchase
								</span>
								<span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
									ZIP Full Pack
								</span>
								<span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
									Receipts & Licenses
								</span>
							</div>
						</div>

						<div className="rounded-[1.5rem] border border-[#EAD9C7]/15 bg-[#4E3523]/70 p-3 shadow-xl shadow-black/20 backdrop-blur">
							<div className="rounded-[1.2rem] bg-[#2B1D14] p-3">
								<img
									src="/icons/musicworld.png"
									alt="Music World logo"
									className="mx-auto h-28 w-full object-contain"
								/>
							</div>
							<div className="mt-3 grid grid-cols-3 gap-2 text-center">
								<div className="rounded-xl border border-white/10 bg-white/[0.06] px-2 py-3">
									<p className="text-xl font-black text-white">{totalTracks}</p>
									<p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#EAD9C7]/70">
										Tracks
									</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-white/[0.06] px-2 py-3">
									<p className="text-xl font-black text-white">2</p>
									<p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#EAD9C7]/70">
										Versions
									</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-white/[0.06] px-2 py-3">
									<p className="text-xl font-black text-white">1</p>
									<p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#EAD9C7]/70">
										Seller
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<div className="px-6 py-8">
				<div className="mx-auto max-w-5xl">
					<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8A6A52]">
								{searchQuery ? "Search results" : "Latest drops"}
							</p>
							<h2 className="mt-2 text-2xl font-black text-[#4E3523]">
								{searchQuery ? `Matching "${searchQuery}"` : "Browse available tracks"}
							</h2>
						</div>
						<p className="rounded-full border border-[#D6CFC7] bg-white px-4 py-2 text-sm font-semibold text-[#4E3523]/75 shadow-sm">
							{totalTracks === 0
								? "0 tracks"
								: `${visibleStart}-${visibleEnd} of ${totalTracks} ${
										totalTracks === 1 ? "track" : "tracks"
									}`}
						</p>
					</div>

					{tracks.length === 0 ? (
						<div className="overflow-hidden rounded-[2rem] border border-[#D6CFC7] bg-white shadow-sm">
							<div className="bg-[#2B1D14] px-6 py-8 text-center text-white">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF8ED] text-2xl font-black text-[#4E3523]">
									♪
								</div>
								<p className="text-xl font-black">
									{searchQuery ? "No tracks found" : "No tracks uploaded yet"}
								</p>
								<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#EAD9C7]/80">
									{searchQuery
										? "Try searching another title, or clear the search to browse all tracks."
										: "Once OXAMIC uploads beats, previews and purchase options will appear here."}
								</p>
							</div>
						</div>
					) : (
						<>
							<TrackFeedList tracks={feedTracks} isGuest={!user} />

							{totalPages > 1 && (
								<nav className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#D6CFC7] bg-white px-4 py-4 shadow-sm sm:flex-row">
									<p className="text-sm font-semibold text-[#4E3523]/70">
										Page {currentPage} of {totalPages}
									</p>

									<div className="flex items-center gap-2">
										{currentPage > 1 ? (
											<Link
												href={getPageHref(currentPage - 1)}
												className="rounded-full border border-[#D6CFC7] px-4 py-2 text-sm font-bold text-[#4E3523] transition hover:bg-[#FAF8ED]"
											>
												Previous
											</Link>
										) : (
											<span className="cursor-not-allowed rounded-full border border-[#D6CFC7] px-4 py-2 text-sm font-bold text-[#4E3523]/35">
												Previous
											</span>
										)}

										{currentPage < totalPages ? (
											<Link
												href={getPageHref(currentPage + 1)}
												className="rounded-full bg-[#4E3523] px-4 py-2 text-sm font-bold text-[#FAF8ED] transition hover:opacity-90"
											>
												Next
											</Link>
										) : (
											<span className="cursor-not-allowed rounded-full bg-[#4E3523]/30 px-4 py-2 text-sm font-bold text-white">
												Next
											</span>
										)}
									</div>
								</nav>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
