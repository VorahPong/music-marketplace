"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { usePlayer } from "./PlayerProvider";

function formatTime(seconds: number) {
	if (!Number.isFinite(seconds)) return "0:00";

	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);

	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function BottomPlayer() {
	const {
		currentTrack,
		isPlaying,
		currentTime,
		duration,
		volume,
		togglePlayPause,
		seekTo,
		setVolumeLevel,
	} = usePlayer();

	if (!currentTrack) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#D6CFC7] bg-white/95 backdrop-blur">
			<div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
				<div className="min-w-0 md:w-64">
					<p className="truncate text-sm text-[#4E3523]/70">
						{currentTrack.artistName}
					</p>
					<h3 className="truncate text-base font-semibold text-[#4E3523]">
						{currentTrack.title}
					</h3>
				</div>

				<div className="flex flex-1 flex-col items-center gap-3">
					<button
						onClick={togglePlayPause}
						className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4E3523] text-[#FAF8ED] hover:opacity-90"
					>
						{isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
					</button>

					<div className="flex w-full items-center gap-3">
						<span className="w-12 text-xs text-[#4E3523]/70">
							{formatTime(currentTime)}
						</span>

						<input
							type="range"
							min={0}
							max={duration || 0}
							step={0.1}
							value={currentTime}
							onChange={(e) => seekTo(Number(e.target.value))}
							className="w-full"
						/>

						<span className="w-12 text-right text-xs text-[#4E3523]/70">
							{formatTime(duration)}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-3 md:w-64 md:justify-end">
					<Volume2 size={18} className="text-[#4E3523]" />
					<input
						type="range"
						min={0}
						max={1}
						step={0.01}
						value={volume}
						onChange={(e) => setVolumeLevel(Number(e.target.value))}
						className="w-28"
					/>
				</div>
			</div>
		</div>
	);
}