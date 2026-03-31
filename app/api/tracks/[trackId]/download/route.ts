import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

type RouteProps = {
	params: Promise<{
		trackId: string;
	}>;
};

export async function GET(_: Request, { params }: RouteProps) {
	try {
		const { trackId } = await params;
		const user = await getCurrentUser();

		const track = await prisma.track.findUnique({
			where: { id: trackId },
			select: {
				id: true,
				title: true,
				fileUrl: true,
				isForSale: true,
				ownerId: true,
			},
		});

		if (!track) {
			return NextResponse.json({ error: "Track not found." }, { status: 404 });
		}

		const isOwner = user?.id === track.ownerId;

		if (!track.isForSale) {
			return NextResponse.redirect(
				new URL(
					track.fileUrl,
					process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
				),
			);
		}

		if (!user) {
			return NextResponse.json(
				{ error: "You must be logged in to download this track." },
				{ status: 401 },
			);
		}

		if (isOwner) {
			return NextResponse.redirect(
				new URL(
					track.fileUrl,
					process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
				),
			);
		}

		const purchase = await prisma.trackPurchase.findUnique({
			where: {
				userId_trackId: {
					userId: user.id,
					trackId: track.id,
				},
			},
			select: {
				id: true,
			},
		});

		if (!purchase) {
			return NextResponse.json(
				{ error: "You do not own this track." },
				{ status: 403 },
			);
		}

		return NextResponse.redirect(
			new URL(
				track.fileUrl,
				process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
			),
		);
	} catch (error) {
		console.error("Download route error:", error);
		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
