"use client";

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

type PlayerTrack = {
	id: string;
	title: string;
	fileUrl: string;
	artistName: string;
	trackType?: string | null;
};

type PlayerContextType = {
	currentTrack: PlayerTrack | null;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	playTrack: (track: PlayerTrack) => Promise<void>;
	togglePlayPause: () => void;
	seekTo: (time: number) => void;
	setVolumeLevel: (value: number) => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);

	useEffect(() => {
		const audio = new Audio();
		audio.preload = "auto";
		audio.volume = 1;
		audioRef.current = audio;

		function handleTimeUpdate() {
			setCurrentTime(audio.currentTime);
		}

		function handleLoadedMetadata() {
			setDuration(audio.duration || 0);
		}

		function handlePlay() {
			setIsPlaying(true);
		}

		function handlePause() {
			setIsPlaying(false);
		}

		function handleEnded() {
			setIsPlaying(false);
			setCurrentTime(0);
		}

		audio.addEventListener("timeupdate", handleTimeUpdate);
		audio.addEventListener("loadedmetadata", handleLoadedMetadata);
		audio.addEventListener("play", handlePlay);
		audio.addEventListener("pause", handlePause);
		audio.addEventListener("ended", handleEnded);

		return () => {
			audio.pause();
			audio.removeEventListener("timeupdate", handleTimeUpdate);
			audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
			audio.removeEventListener("play", handlePlay);
			audio.removeEventListener("pause", handlePause);
			audio.removeEventListener("ended", handleEnded);
		};
	}, []);

	async function playTrack(track: PlayerTrack) {
		const audio = audioRef.current;
		if (!audio) return;

		const isSameTrack = currentTrack?.id === track.id;

		if (isSameTrack) {
			if (audio.paused) {
				await audio.play();
			} else {
				audio.pause();
			}
			return;
		}

		audio.pause();
		audio.src = track.fileUrl;
		audio.load();

		setCurrentTrack(track);
		setCurrentTime(0);
		setDuration(0);

		try {
			await audio.play();
		} catch (error) {
			console.error("Failed to play track:", error);
		}
	}

	function togglePlayPause() {
		const audio = audioRef.current;
		if (!audio || !currentTrack) return;

		if (audio.paused) {
			audio.play().catch((error) => {
				console.error("Failed to resume playback:", error);
			});
		} else {
			audio.pause();
		}
	}

	function seekTo(time: number) {
		const audio = audioRef.current;
		if (!audio) return;

		audio.currentTime = time;
		setCurrentTime(time);
	}

	function setVolumeLevel(value: number) {
		const audio = audioRef.current;
		if (!audio) return;

		audio.volume = value;
		setVolume(value);
	}

	const value = useMemo(
		() => ({
			currentTrack,
			isPlaying,
			currentTime,
			duration,
			volume,
			playTrack,
			togglePlayPause,
			seekTo,
			setVolumeLevel,
		}),
		[currentTrack, isPlaying, currentTime, duration, volume],
	);

	return (
		<PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
	);
}

export function usePlayer() {
	const context = useContext(PlayerContext);

	if (!context) {
		throw new Error("usePlayer must be used within PlayerProvider");
	}

	return context;
}