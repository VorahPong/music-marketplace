import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteProps = {
	params: Promise<{
		trackId: string;
	}>;
};

export async function POST(_: Request, { params }: RouteProps) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
		}

		const { trackId } = await params;

		const track = await prisma.track.findUnique({
			where: { id: trackId },
			select: {
				id: true,
				title: true,
				isForSale: true,
				priceInPoints: true,
				ownerId: true,
			},
		});

		if (!track) {
			return NextResponse.json({ error: "Track not found." }, { status: 404 });
		}

		if (!track.isForSale) {
			return NextResponse.json(
				{ error: "This track is not for sale." },
				{ status: 400 },
			);
		}

		if (!track.priceInPoints || track.priceInPoints <= 0) {
			return NextResponse.json(
				{ error: "This track does not have a valid price." },
				{ status: 400 },
			);
		}

		if (track.ownerId === user.id) {
			return NextResponse.json(
				{ error: "You cannot buy your own track." },
				{ status: 400 },
			);
		}

		const existingPurchase = await prisma.trackPurchase.findUnique({
			where: {
				userId_trackId: {
					userId: user.id,
					trackId: track.id,
				},
			},
		});

		if (existingPurchase) {
			return NextResponse.json(
				{ error: "You already own this track." },
				{ status: 409 },
			);
		}

		const freshUser = await prisma.user.findUnique({
			where: { id: user.id },
			select: { id: true, points: true },
		});

		if (!freshUser) {
			return NextResponse.json({ error: "User not found." }, { status: 404 });
		}

		if (freshUser.points < track.priceInPoints) {
			return NextResponse.json(
				{ error: "Not enough points." },
				{ status: 400 },
			);
		}

		const result = await prisma.$transaction(async (tx) => {
			const currentUser = await tx.user.findUnique({
				where: { id: user.id },
				select: { id: true, points: true },
			});

			if (!currentUser) {
				throw new Error("USER_NOT_FOUND");
			}

			if (currentUser.points < track.priceInPoints!) {
				throw new Error("INSUFFICIENT_POINTS");
			}

			const alreadyPurchased = await tx.trackPurchase.findUnique({
				where: {
					userId_trackId: {
						userId: user.id,
						trackId: track.id,
					},
				},
			});

			if (alreadyPurchased) {
				throw new Error("ALREADY_PURCHASED");
			}

			await tx.user.update({
				where: { id: user.id },
				data: {
					points: {
						decrement: track.priceInPoints!,
					},
				},
			});

			const purchase = await tx.trackPurchase.create({
				data: {
					userId: user.id,
					trackId: track.id,
					pointsPaid: track.priceInPoints!,
				},
			});

			return purchase;
		});

		return NextResponse.json(
			{
				message: "Track purchased successfully.",
				purchase: result,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Buy track error:", error);

		if (error instanceof Error) {
			if (error.message === "INSUFFICIENT_POINTS") {
				return NextResponse.json(
					{ error: "Not enough points." },
					{ status: 400 },
				);
			}

			if (error.message === "ALREADY_PURCHASED") {
				return NextResponse.json(
					{ error: "You already own this track." },
					{ status: 409 },
				);
			}

			if (error.message === "USER_NOT_FOUND") {
				return NextResponse.json({ error: "User not found." }, { status: 404 });
			}
		}

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
