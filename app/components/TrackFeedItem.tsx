"use client";

import {
	Heart,
	MessageCircle,
	Music2,
	Play,
	Pause,
	Share2,
	Download,
	ShoppingCart,
	Pencil,
	FileText,
	Receipt,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import ShareTrackModal from "./ShareTrackModal";
import { usePlayer } from "./player/PlayerProvider";

// do not remove
// app/components/TrackFeedItem.tsx

type TrackFeedItemProps = {
	track: {
		id: string;
		title: string;
		description: string | null;
		previewMp3Url: string;
		previewFileType?: string | null;
		regularWavKey?: string | null;
		fullZipKey?: string | null;
		trackType?: string | null;
		bpm?: number | null;
		timeSignature?: string | null;
		musicalKey?: string | null;
		createdAt?: string | Date | null;
		likesCount: number;
		isLiked: boolean;
		commentCount: number;
		isForSale?: boolean;
		regularPriceCents?: number | null;
		fullPriceCents?: number | null;
		isRegularOwned?: boolean;
		isFullOwned?: boolean;
		isOwned?: boolean;
		regularPurchaseId?: string | null;
		fullPurchaseId?: string | null;
		isOwner?: boolean;
		owner?: {
			name: string | null;
			handle: string | null;
		} | null;
	};
	isGuest?: boolean;
};

export default function TrackFeedItem({
	track,
	isGuest = true,
}: TrackFeedItemProps) {
	const waveContainerRef = useRef<HTMLDivElement | null>(null);
	const waveSurferRef = useRef<WaveSurfer | null>(null);

	const [isShareOpen, setIsShareOpen] = useState(false);
	const [copyMessage, setCopyMessage] = useState("");

	const [liked, setLiked] = useState(track.isLiked);
	const [likesCount, setLikesCount] = useState(track.likesCount);
	const [likeLoading, setLikeLoading] = useState(false);

	const { currentTrack, isPlaying, currentTime, duration, playTrack, seekTo } =
		usePlayer();

	const artistName = track.owner?.name || "Unknown Artist";

	const previewUrl = track.previewMp3Url;
	const isRegularOwned = track.isRegularOwned ?? track.isOwned ?? false;
	const isFullOwned = track.isFullOwned ?? false;
	const regularPurchaseId = track.regularPurchaseId ?? null;
	const fullPurchaseId = track.fullPurchaseId ?? null;
	const hasFullVersion = Boolean(track.fullZipKey && track.fullPriceCents);

	const displayTrackType = track.trackType
		? `#${track.trackType.charAt(0)}${track.trackType.slice(1).toLowerCase()}`
		: "#Song";

	const metadataItems = [
		track.bpm ? `${track.bpm} BPM` : null,
		track.musicalKey || null,
		track.timeSignature || null,
	].filter(Boolean);

	const displayRelativeTime = formatRelativeTime(track.createdAt);

	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/main/song/${track.id}`
			: `/main/song/${track.id}`;

	const isCurrentTrack = currentTrack?.id === track.id;
	const isThisTrackPlaying = isCurrentTrack && isPlaying;

	function formatUsd(priceCents?: number | null) {
		if (!priceCents) return "$0.00";

		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(priceCents / 100);
	}

	useEffect(() => {
		if (!waveContainerRef.current) return;

		const ws = WaveSurfer.create({
			container: waveContainerRef.current,
			url: previewUrl,
			height: 72,
			barWidth: 2,
			barGap: 1,
			barRadius: 999,
			waveColor: "#D9CFC3",
			progressColor: "#6B4A30",
			cursorWidth: 0,
			normalize: true,
			interact: true,
		});

		waveSurferRef.current = ws;

		return () => {
			ws.destroy();
			waveSurferRef.current = null;
		};
	}, [previewUrl]);

	useEffect(() => {
		const ws = waveSurferRef.current;
		if (!ws) return;

		try {
			if (isCurrentTrack && duration > 0) {
				ws.seekTo(currentTime / duration);
			} else {
				ws.seekTo(0);
			}
		} catch {
			// ignore until ready
		}
	}, [isCurrentTrack, currentTime, duration]);

	useEffect(() => {
		const ws = waveSurferRef.current;
		if (!ws) return;

		const handleWaveClick = async (relativeX: number) => {
			const clickedTime = ws.getDuration() * relativeX;

			if (currentTrack?.id === track.id) {
				seekTo(clickedTime);
				return;
			}

			await playTrack({
				id: track.id,
				title: track.title,
				fileUrl: previewUrl,
				artistName,
				trackType: track.trackType,
				artistHandle: track.owner?.handle ?? null,
			});

			setTimeout(() => {
				seekTo(clickedTime);
			}, 150);
		};

		ws.on("click", handleWaveClick);

		return () => {
			ws.un("click", handleWaveClick);
		};
	}, [
		currentTrack?.id,
		track.id,
		track.title,
		previewUrl,
		track.trackType,
		artistName,
		playTrack,
		seekTo,
	]);

	async function handleTogglePlay() {
		await playTrack({
			id: track.id,
			title: track.title,
			fileUrl: previewUrl,
			artistName,
			trackType: track.trackType,
			artistHandle: track.owner?.handle ?? null,
		});
	}

	function handleProtectedAction(actionName: string) {
		if (isGuest) {
			window.location.href = "/auth/login";
			return;
		}

		console.log(`${actionName} clicked for track ${track.id}`);
	}

	async function handleCopyLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopyMessage("Link copied!");

			setTimeout(() => {
				setCopyMessage("");
			}, 2000);
		} catch (error) {
			console.error("Copy failed:", error);
			setCopyMessage("Copy failed");

			setTimeout(() => {
				setCopyMessage("");
			}, 2000);
		}
	}

	function formatTime(seconds: number) {
		if (!Number.isFinite(seconds)) return "0:00";

		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);

		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	function formatRelativeTime(dateValue?: string | Date | null) {
		if (!dateValue) return "Recently";

		const date = new Date(dateValue);
		if (Number.isNaN(date.getTime())) return "Recently";

		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const minute = 1000 * 60;
		const hour = minute * 60;
		const day = hour * 24;
		const month = day * 30;
		const year = month * 12;

		if (diffMs < minute) return "Just now";
		if (diffMs < hour) {
			const minutes = Math.floor(diffMs / minute);
			return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
		}
		if (diffMs < day) {
			const hours = Math.floor(diffMs / hour);
			return `${hours} hour${hours === 1 ? "" : "s"} ago`;
		}
		if (diffMs < month) {
			const days = Math.floor(diffMs / day);
			return `${days} day${days === 1 ? "" : "s"} ago`;
		}
		if (diffMs < year) {
			const months = Math.floor(diffMs / month);
			return `${months} month${months === 1 ? "" : "s"} ago`;
		}

		const years = Math.floor(diffMs / year);
		return `${years} year${years === 1 ? "" : "s"} ago`;
	}

	const displayedCurrentTime = isCurrentTrack ? currentTime : 0;
	const displayedDuration = isCurrentTrack ? duration : 0;

	const progressPercent = useMemo(() => {
		if (!displayedDuration) return 0;
		return (displayedCurrentTime / displayedDuration) * 100;
	}, [displayedCurrentTime, displayedDuration]);

	async function handleLike() {
		if (isGuest) {
			window.location.href = "/auth/login";
			return;
		}

		if (likeLoading) return;

		setLikeLoading(true);
		try {
			const response = await fetch(`/api/tracks/${track.id}/like`, {
				method: liked ? "DELETE" : "POST",
			});

			const data = await response.json();

			if (!response.ok) {
				console.error("Error liking track:", data.error);
				return;
			}

			setLiked(data.liked);
			setLikesCount(data.likesCount);
		} catch (error) {
			console.error("Error liking track:", error);
		} finally {
			setLikeLoading(false);
		}
	}

	const [buyLoadingVersion, setBuyLoadingVersion] = useState<
		"REGULAR" | "FULL" | null
	>(null);
	const [regularOwned, setRegularOwned] = useState(isRegularOwned);
	const [fullOwned, setFullOwned] = useState(isFullOwned);

	async function handleBuyTrack(version: "REGULAR" | "FULL") {
		if (isGuest) {
			window.location.href = "/auth/login";
			return;
		}

		if (buyLoadingVersion) return;
		if (version === "REGULAR" && regularOwned) return;
		if (version === "FULL" && fullOwned) return;

		setBuyLoadingVersion(version);

		try {
			const response = await fetch("/api/paypal/create-order", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					trackId: track.id,
					version,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				alert(data.error || "Failed to create PayPal order.");
				return;
			}

			const approveLink = data.links?.find(
				(link: { rel: string; href: string }) => link.rel === "approve",
			)?.href;

			if (!approveLink) {
				alert("PayPal approval link was not returned.");
				return;
			}

			window.location.href = approveLink;
		} catch (error) {
			console.error("PayPal create order error:", error);
			alert("Something went wrong while opening PayPal.");
		} finally {
			setBuyLoadingVersion(null);
		}
	}

	function handleDownloadTrack(version: "REGULAR" | "FULL") {
		window.open(
			`/api/tracks/${track.id}/download?version=${version}`,
			"_blank",
		);
	}

	function openPurchaseDocument(
		purchaseId: string | null,
		documentType: "license" | "receipt",
	) {
		if (!purchaseId) return;

		window.open(`/api/purchases/${purchaseId}/${documentType}`, "_blank");
	}

	return (
		<>
			<div className="relative rounded-3xl border border-[#D6CFC7] bg-white p-4 shadow-sm">
				<div className="absolute right-4 top-4 flex flex-col items-end gap-2">
					<span className="text-xs text-[#4E3523]/60">
						{displayRelativeTime}
					</span>
					<div className="rounded-full bg-[#FAF8ED] px-3 py-1 text-xs font-semibold text-[#4E3523] shadow-sm">
						{displayTrackType}
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex items-start gap-4">
						<div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-[#EAD9C7] text-[#4E3523] shadow-sm">
							<Music2 size={34} />
						</div>

						<button
							onClick={handleTogglePlay}
							className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#6B4A30] text-[#FAF8ED] shadow-md transition hover:opacity-90"
						>
							{isThisTrackPlaying ? (
								<Pause size={26} />
							) : (
								<Play size={26} className="ml-1" />
							)}
						</button>

						<div className="min-w-0 flex-1">
							<Link
								href={
									track.owner?.handle
										? `/main/channel/${track.owner.handle}`
										: "#"
								}
								className="text-sm text-[#4E3523]/70 hover:underline"
							>
								{artistName}
							</Link>

							<Link href={`/main/song/${track.id}`}>
								<h2 className="truncate text-2xl font-semibold hover:underline">
									{track.title}
								</h2>
							</Link>

							{metadataItems.length > 0 && (
								<div className="mt-2 flex flex-wrap gap-2">
									{metadataItems.map((item) => (
										<span
											key={item}
											className="rounded-full bg-[#FAF8ED] px-3 py-1 text-xs font-medium text-[#4E3523]/75"
										>
											{item}
										</span>
									))}
								</div>
							)}

							<div className="mt-4">
								<div ref={waveContainerRef} />

								<div className="mt-3 flex items-center gap-3">
									<span className="w-12 text-xs text-[#4E3523]/70">
										{formatTime(displayedCurrentTime)}
									</span>

									<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E7DED5]">
										<div
											className="h-full rounded-full bg-[#6B4A30]"
											style={{ width: `${progressPercent}%` }}
										/>
									</div>

									<span className="w-12 text-right text-xs text-[#4E3523]/70">
										{formatTime(displayedDuration)}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-4 flex items-center gap-3">
					<button
						onClick={handleLike}
						disabled={likeLoading}
						className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-[#4E3523]/10 ${
							liked ? "text-[#6B4A30] font-medium" : "text-[#4E3523]"
						}`}
					>
						<Heart size={18} fill={liked ? "currentColor" : "none"} />
						{likesCount}
					</button>

					<Link
						href={`/main/song/${track.id}`}
						className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
					>
						<MessageCircle size={18} />
						{track.commentCount ?? 0}
					</Link>

					<button
						onClick={() => setIsShareOpen(true)}
						className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
					>
						<Share2 size={18} />
						Share
					</button>

					{track.isOwner ? (
						<Link
							href={`/main/dashboard/edit/${track.id}`}
							className="ml-auto flex items-center gap-2 rounded-full bg-[#FAF8ED] px-4 py-2 text-sm font-medium text-[#4E3523] hover:bg-[#EAD9C7]"
						>
							<Pencil size={16} />
							Edit Track
						</Link>
					) : track.isForSale ? (
						<div className="ml-auto flex flex-wrap items-center justify-end gap-2">
							{regularOwned ? (
								<div className="flex flex-wrap items-center justify-end gap-2">
									<button
										onClick={() => handleDownloadTrack("REGULAR")}
										className="flex items-center gap-2 rounded-full bg-[#4E3523] px-4 py-2 text-sm font-medium text-[#FAF8ED]"
									>
										<Download size={16} />
										Regular WAV
									</button>

									{regularPurchaseId && (
										<>
											<button
												onClick={() => openPurchaseDocument(regularPurchaseId, "license")}
												className="flex items-center gap-2 rounded-full border border-[#D6CFC7] px-3 py-2 text-sm font-medium text-[#4E3523] hover:bg-[#FAF8ED]"
											>
												<FileText size={15} />
												License
											</button>

											<button
												onClick={() => openPurchaseDocument(regularPurchaseId, "receipt")}
												className="flex items-center gap-2 rounded-full border border-[#D6CFC7] px-3 py-2 text-sm font-medium text-[#4E3523] hover:bg-[#FAF8ED]"
											>
												<Receipt size={15} />
												Receipt
											</button>
										</>
									)}
								</div>
							) : (
								<button
									onClick={() => handleBuyTrack("REGULAR")}
									disabled={buyLoadingVersion !== null}
									className="flex items-center gap-2 rounded-full bg-[#4E3523] px-4 py-2 text-sm font-medium text-[#FAF8ED] disabled:opacity-60"
								>
									<ShoppingCart size={16} />
									{buyLoadingVersion === "REGULAR"
										? "Buying..."
										: `Regular ${formatUsd(track.regularPriceCents)}`}
								</button>
							)}

							{hasFullVersion &&
								(fullOwned ? (
									<div className="flex flex-wrap items-center justify-end gap-2">
										<button
											onClick={() => handleDownloadTrack("FULL")}
											className="flex items-center gap-2 rounded-full border border-[#4E3523] px-4 py-2 text-sm font-medium text-[#4E3523]"
										>
											<Download size={16} />
											Full ZIP
										</button>

										{fullPurchaseId && (
											<>
												<button
													onClick={() => openPurchaseDocument(fullPurchaseId, "license")}
													className="flex items-center gap-2 rounded-full border border-[#D6CFC7] px-3 py-2 text-sm font-medium text-[#4E3523] hover:bg-[#FAF8ED]"
												>
													<FileText size={15} />
													License
												</button>

												<button
													onClick={() => openPurchaseDocument(fullPurchaseId, "receipt")}
													className="flex items-center gap-2 rounded-full border border-[#D6CFC7] px-3 py-2 text-sm font-medium text-[#4E3523] hover:bg-[#FAF8ED]"
												>
													<Receipt size={15} />
													Receipt
												</button>
											</>
										)}
									</div>
								) : (
									<button
										onClick={() => handleBuyTrack("FULL")}
										disabled={buyLoadingVersion !== null}
										className="flex items-center gap-2 rounded-full border border-[#4E3523] px-4 py-2 text-sm font-medium text-[#4E3523] disabled:opacity-60"
									>
										<ShoppingCart size={16} />
										{buyLoadingVersion === "FULL"
											? "Buying..."
											: `Full ${formatUsd(track.fullPriceCents)}`}
									</button>
								))}
						</div>
					) : (
						<button
							onClick={() => handleProtectedAction("support")}
							className="ml-auto flex items-center gap-2 rounded-full border border-[#4E3523] px-4 py-2 text-sm font-medium text-[#4E3523]"
						>
							Support
						</button>
					)}
				</div>
			</div>

			{isShareOpen && (
				<ShareTrackModal
					isOpen={isShareOpen}
					onClose={() => setIsShareOpen(false)}
					shareUrl={shareUrl}
					copyMessage={copyMessage}
					onCopyLink={handleCopyLink}
				/>
			)}
		</>
	);
}
