import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// app/api/tracks/[trackId]/buy/route.ts

type RouteProps = {
	params: Promise<{
		trackId: string;
	}>;
};

type PurchaseVersion = "REGULAR" | "FULL";

export async function POST(req: Request, { params }: RouteProps) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
		}

		const { trackId } = await params;
		const body = await req.json().catch(() => ({}));
		const version = body.version as PurchaseVersion | undefined;

		if (version !== "REGULAR" && version !== "FULL") {
			return NextResponse.json(
				{ error: "Invalid purchase version." },
				{ status: 400 },
			);
		}

		const track = await prisma.track.findUnique({
			where: { id: trackId },
			select: {
				id: true,
				title: true,
				isForSale: true,
				ownerId: true,
				regularWavKey: true,
				fullZipKey: true,
				regularPriceCents: true,
				fullPriceCents: true,
			},
		});

		if (!track) {
			return NextResponse.json({ error: "Track not found." }, { status: 404 });
		}

		if (track.ownerId === user.id) {
			return NextResponse.json(
				{ error: "You cannot buy your own track." },
				{ status: 400 },
			);
		}

		if (!track.isForSale) {
			return NextResponse.json(
				{ error: "This track is not for sale." },
				{ status: 400 },
			);
		}

		const downloadKey = version === "REGULAR" ? track.regularWavKey : track.fullZipKey;
		const amountCents =
			version === "REGULAR" ? track.regularPriceCents : track.fullPriceCents;

		if (!downloadKey || !amountCents || amountCents <= 0) {
			return NextResponse.json(
				{ error: `${version === "REGULAR" ? "Regular" : "Full"} version is not available.` },
				{ status: 400 },
			);
		}

		const existingPurchase = await prisma.trackPurchase.findUnique({
			where: {
				userId_trackId_version: {
					userId: user.id,
					trackId: track.id,
					version,
				},
			},
		});

		if (existingPurchase) {
			return NextResponse.json(
				{ error: `You already own the ${version === "REGULAR" ? "regular" : "full"} version of this track.` },
				{ status: 409 },
			);
		}

		const purchase = await prisma.trackPurchase.create({
			data: {
				userId: user.id,
				trackId: track.id,
				version,
				amountCents,
			},
		});

		return NextResponse.json(
			{
				message: `${version === "REGULAR" ? "Regular" : "Full"} version purchased successfully.`,
				purchase,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Buy track error:", error);

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
