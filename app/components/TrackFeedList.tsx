"use client";

import { useState } from "react";
import TrackFeedItem from "./TrackFeedItem";

type TrackFeedListProps = {
	tracks: {
		id: string;
		title: string;
		description: string | null;
		fileUrl: string;
		trackType?: string | null;
		createdAt?: string | Date | null;
		isForSale?: boolean;
		priceInPoints?: number | null;
		owner?: {
			id: string;
			name: string | null;
			handle: string | null;
		} | null;
	}[];
	isGuest: boolean;
};

export default function TrackFeedList({
	tracks,
	isGuest,
}: TrackFeedListProps) {
	const [activeTrackId, setActiveTrackId] = useState<string | null>(null);

	return (
		<div className="mt-8 space-y-6">
			{tracks.map((track) => (
				<TrackFeedItem
					key={track.id}
					track={track}
					isGuest={isGuest}
					isActive={activeTrackId === track.id}
					onPlayRequest={setActiveTrackId}
				/>
			))}
		</div>
	);
}