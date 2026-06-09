"use client";

import TrackFeedItem from "./TrackFeedItem";

type TrackFeedListProps = {
	tracks: {
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
		isOwner?: boolean;
		owner?: {
			id: string;
			name: string | null;
			handle: string | null;
		} | null;
	}[];
	isGuest: boolean;
};

export default function TrackFeedList({ tracks, isGuest }: TrackFeedListProps) {
	return (
		<div className="mt-8 space-y-6">
			{tracks.map((track) => (
				<TrackFeedItem key={track.id} track={track} isGuest={isGuest} />
			))}
		</div>
	);
}
