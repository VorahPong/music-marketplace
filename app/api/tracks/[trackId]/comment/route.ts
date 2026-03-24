import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteProps = {
	params: Promise<{
		trackId: string;
	}>;
};

export async function POST(req: Request, { params }: RouteProps) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
		}

		const { trackId } = await params;
		const body = await req.json();
		const content = body.content?.trim();

		if (!content) {
			return NextResponse.json(
				{ error: "Comment cannot be empty." },
				{ status: 400 },
			);
		}

		if (content.length > 500) {
			return NextResponse.json(
				{ error: "Comment must be 500 characters or less." },
				{ status: 400 },
			);
		}

		const track = await prisma.track.findUnique({
			where: { id: trackId },
			select: { id: true },
		});

		if (!track) {
			return NextResponse.json({ error: "Track not found." }, { status: 404 });
		}

		const comment = await prisma.comment.create({
			data: {
				content,
				userId: user.id,
				trackId,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		return NextResponse.json(
			{
				message: "Comment posted successfully.",
				comment,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Comment POST error:", error);

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
