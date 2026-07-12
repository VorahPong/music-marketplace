// do not remove
// app/api/tracks/[trackId]/gift/route.ts

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

type GiftBody = {
	recipientEmail?: string;
	version?: "REGULAR" | "FULL";
};

function createGiftReceiptNumber() {
	return `GIFT-${randomBytes(8).toString("hex").toUpperCase()}`;
}

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ trackId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
		}

		if (user.role !== "SELLER" && user.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Only sellers and admins can gift tracks." },
				{ status: 403 },
			);
		}

		const { trackId } = await params;
		const body = (await req.json()) as GiftBody;

		const recipientEmail = body.recipientEmail?.trim().toLowerCase();
		const version = body.version;

		if (!recipientEmail) {
			return NextResponse.json(
				{ error: "Recipient email is required." },
				{ status: 400 },
			);
		}

		if (version !== "REGULAR" && version !== "FULL") {
			return NextResponse.json(
				{ error: "Gift version must be REGULAR or FULL." },
				{ status: 400 },
			);
		}

		const track = await prisma.track.findUnique({
			where: { id: trackId },
			select: {
				id: true,
				title: true,
				ownerId: true,
				isForSale: true,
				deletedAt: true,
				regularWavKey: true,
				fullZipKey: true,
			},
		});

		if (!track || track.deletedAt) {
			return NextResponse.json({ error: "Track not found." }, { status: 404 });
		}

		const isOwner = track.ownerId === user.id;
		const isAdmin = user.role === "ADMIN";

		if (!isOwner && !isAdmin) {
			return NextResponse.json(
				{ error: "You can only gift your own tracks." },
				{ status: 403 },
			);
		}

		if (!track.isForSale) {
			return NextResponse.json(
				{ error: "Only tracks listed for sale can be gifted." },
				{ status: 400 },
			);
		}

		if (version === "REGULAR" && !track.regularWavKey) {
			return NextResponse.json(
				{ error: "This track does not have a regular WAV version." },
				{ status: 400 },
			);
		}

		if (version === "FULL" && !track.fullZipKey) {
			return NextResponse.json(
				{ error: "This track does not have a full ZIP version." },
				{ status: 400 },
			);
		}

		const recipient = await prisma.user.findUnique({
			where: { email: recipientEmail },
			select: {
				id: true,
				email: true,
				name: true,
				handle: true,
			},
		});

		if (!recipient) {
			return NextResponse.json(
				{
					error:
						"No user account was found with that email. Ask them to create an account first.",
				},
				{ status: 404 },
			);
		}

		if (recipient.id === user.id) {
			return NextResponse.json(
				{ error: "You cannot gift a track to yourself." },
				{ status: 400 },
			);
		}

		const existingPurchases = await prisma.trackPurchase.findMany({
			where: {
				userId: recipient.id,
				trackId: track.id,
			},
			select: {
				id: true,
				version: true,
			},
		});

		const alreadyOwnsFull = existingPurchases.some(
			(purchase) => purchase.version === "FULL",
		);
		const alreadyOwnsRegular = existingPurchases.some(
			(purchase) => purchase.version === "REGULAR",
		);

		if (alreadyOwnsFull) {
			return NextResponse.json(
				{ error: "This user already owns the full version." },
				{ status: 409 },
			);
		}

		if (version === "REGULAR" && alreadyOwnsRegular) {
			return NextResponse.json(
				{ error: "This user already owns the regular version." },
				{ status: 409 },
			);
		}

		const giftedPurchase = await prisma.trackPurchase.create({
			data: {
				userId: recipient.id,
				trackId: track.id,
				version,
				amountCents: 0,
				receiptNumber: createGiftReceiptNumber(),
				paypalOrderId: null,
				paypalCaptureId: null,
				licenseType: "STANDARD",
			},
			select: {
				id: true,
				version: true,
				receiptNumber: true,
				createdAt: true,
			},
		});

		return NextResponse.json({
			message: `${track.title} was gifted to ${recipient.email}.`,
			purchase: giftedPurchase,
		});
	} catch (error) {
		console.error("Gift track error:", error);

		return NextResponse.json(
			{ error: "Failed to gift track." },
			{ status: 500 },
		);
	}
}
