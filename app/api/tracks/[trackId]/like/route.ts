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
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { trackId } = await params;

		const track = await prisma.track.findUnique({
			where: { id: trackId },
			select: { id: true },
		});
		if (!track) {
			return NextResponse.json({ error: "Track not found" }, { status: 404 });
		}

		const existingLike = await prisma.like.findUnique({
			where: {
				userId_trackId: {
					userId: user.id,
					trackId: track.id,
				},
			},
		});

		if (!existingLike) {
			await prisma.like.create({
				data: {
					userId: user.id,
					trackId: track.id,
				},
			});
		}

		const likeCount = await prisma.like.count({
			where: { trackId: track.id },
		});

		return NextResponse.json({ liked: true, likeCount });
	} catch (error) {
		console.error("Error liking track:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(_: Request, { params }: RouteProps) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { trackId } = await params;

		await prisma.like.deleteMany({
			where: {
				userId: user.id,
				trackId,
			},
		});

		const likeCount = await prisma.like.count({
			where: { trackId },
		});

		return NextResponse.json({ liked: false, likeCount });
	} catch (error) {
		console.error("Error unliking track:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
