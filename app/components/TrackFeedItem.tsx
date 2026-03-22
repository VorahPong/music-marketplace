"use client";

import {
	Heart,
	MessageCircle,
	Music2,
	Play,
	Pause,
	Share2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

type TrackFeedItemProps = {
	track: {
		id: string;
		title: string;
		description: string | null;
		fileUrl: string;
		trackType?: string | null;
		createdAt?: string | Date | null;
		owner?: {
			name: string | null;
			handle: string | null;
		} | null;
	};
	isGuest?: boolean;
	isActive: boolean;
	onPlayRequest: (trackId: string) => void;
};

export default function TrackFeedItem({
	track,
	isGuest = true,
	isActive,
	onPlayRequest,
}: TrackFeedItemProps) {
	const waveContainerRef = useRef<HTMLDivElement | null>(null);
	const waveSurferRef = useRef<WaveSurfer | null>(null);

	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	const artistName = track.owner?.name || "Unknown Artist";

	// ✅ safe fallback
	const displayTrackType = track.trackType
		? `#${track.trackType.charAt(0)}${track.trackType
				.slice(1)
				.toLowerCase()}`
		: "#Song";

	const displayRelativeTime = formatRelativeTime(track.createdAt);

	useEffect(() => {
		if (!waveContainerRef.current) return;

		const ws = WaveSurfer.create({
			container: waveContainerRef.current,
			url: track.fileUrl,
			height: 72,
			barWidth: 2,
			barGap: 1,
			barRadius: 999,
			waveColor: "#D9CFC3",
			progressColor: "#6B4A30",
			cursorWidth: 0,
			normalize: true,
		});

		waveSurferRef.current = ws;

		ws.on("ready", () => {
			setDuration(ws.getDuration());
		});

		ws.on("timeupdate", (time) => {
			setCurrentTime(time);
		});

		ws.on("play", () => {
			setIsPlaying(true);
		});

		ws.on("pause", () => {
			setIsPlaying(false);
		});

		ws.on("finish", () => {
			setIsPlaying(false);
			setCurrentTime(0);
		});

		return () => {
			ws.destroy();
			waveSurferRef.current = null;
		};
	}, [track.fileUrl]);

	useEffect(() => {
		const ws = waveSurferRef.current;
		if (!ws) return;

		if (!isActive && ws.isPlaying()) {
			ws.pause();
			setIsPlaying(false);
		}
	}, [isActive]);

	async function handleTogglePlay() {
		const ws = waveSurferRef.current;
		if (!ws) return;

		if (ws.isPlaying()) {
			ws.pause();
			return;
		}

		onPlayRequest(track.id);
		await ws.play();
	}

	function handleProtectedAction(actionName: string) {
		if (isGuest) {
			window.location.href = "/login";
			return;
		}

		console.log(`${actionName} clicked for track ${track.id}`);
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

	const progressPercent = useMemo(() => {
		if (!duration) return 0;
		return (currentTime / duration) * 100;
	}, [currentTime, duration]);

	return (
		<div className="relative rounded-3xl border border-[#D6CFC7] bg-white p-4 shadow-sm">
			
			<div className="absolute right-4 top-4 flex flex-col items-end gap-2">
				<span className="text-xs text-[#4E3523]/60">{displayRelativeTime}</span>
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
						{isPlaying ? <Pause size={26} /> : <Play size={26} className="ml-1" />}
					</button>

					<div className="min-w-0 flex-1">
						<Link
							href={track.owner?.handle ? `/main/channel/${track.owner.handle}` : "#"}
							className="text-sm text-[#4E3523]/70 hover:underline"
						>
							{artistName}
						</Link>

						<Link href={`/main/song/${track.id}`}>
							<h2 className="truncate text-2xl font-semibold hover:underline">
								{track.title}
							</h2>
						</Link>

						<div className="mt-4">
							<div ref={waveContainerRef} />

							<div className="mt-3 flex items-center gap-3">
								<span className="w-12 text-xs text-[#4E3523]/70">
									{formatTime(currentTime)}
								</span>

								<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E7DED5]">
									<div
										className="h-full rounded-full bg-[#6B4A30]"
										style={{ width: `${progressPercent}%` }}
									/>
								</div>

								<span className="w-12 text-right text-xs text-[#4E3523]/70">
									{formatTime(duration)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ACTIONS */}
			<div className="mt-4 flex items-center gap-3">
				<button
					onClick={() => handleProtectedAction("like")}
					className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
				>
					<Heart size={18} />
					Like
				</button>

				<button
					onClick={() => handleProtectedAction("comment")}
					className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
				>
					<MessageCircle size={18} />
					Comment
				</button>

				<button
					onClick={() => {
						navigator.clipboard.writeText(window.location.href);
					}}
					className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
				>
					<Share2 size={18} />
					Share
				</button>

				{/* Support / Buy */}
				{track.trackType === "BEAT" ? (
					<button
						onClick={() => handleProtectedAction("buy")}
						className="flex items-center gap-2 rounded-full bg-[#4E3523] px-4 py-2 text-sm font-medium text-[#FAF8ED]"
					>
						Buy (10 pts)
					</button>
				) : (
					<button
						onClick={() => handleProtectedAction("support")}
						className="flex items-center gap-2 rounded-full border border-[#4E3523] px-4 py-2 text-sm font-medium text-[#4E3523]"
					>
						Support
					</button>
				)}
			</div>
		</div>
	);
}