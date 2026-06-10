

// do not remove
// app/main/dashboard/edit/[trackId]/page.tsx

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import CreatePageClient from "../../create/CreatePageClient";

type EditTrackPageProps = {
	params: Promise<{
		trackId: string;
	}>;
};

export default async function EditTrackPage({ params }: EditTrackPageProps) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	const { trackId } = await params;

	const track = await prisma.track.findUnique({
		where: {
			id: trackId,
		},
		select: {
			id: true,
			title: true,
			description: true,
			trackType: true,
			bpm: true,
			timeSignature: true,
			musicalKey: true,
			isForSale: true,
			regularPriceCents: true,
			fullPriceCents: true,
			previewMp3Url: true,
			regularWavKey: true,
			fullZipKey: true,
			ownerId: true,
		},
	});

	if (!track) {
		notFound();
	}

	if (track.ownerId !== user.id) {
		redirect("/main");
	}

	return (
		<CreatePageClient
			mode="edit"
			initialTrack={{
				id: track.id,
				title: track.title,
				description: track.description,
				trackType: track.trackType,
				bpm: track.bpm,
				timeSignature: track.timeSignature,
				musicalKey: track.musicalKey,
				isForSale: track.isForSale,
				regularPriceCents: track.regularPriceCents,
				fullPriceCents: track.fullPriceCents,
				previewMp3Url: track.previewMp3Url,
				regularWavKey: track.regularWavKey,
				fullZipKey: track.fullZipKey,
			}}
		/>
	);
}