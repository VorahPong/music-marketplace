// do not remove
// app/api/users/lookup-by-email/route.ts

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
	}

	if (currentUser.role !== "SELLER" && currentUser.role !== "ADMIN") {
		return NextResponse.json(
			{ error: "Only sellers and admins can look up gift recipients." },
			{ status: 403 },
		);
	}

	const { searchParams } = new URL(req.url);
	const email = searchParams.get("email")?.trim().toLowerCase();

	if (!email) {
		return NextResponse.json({ user: null });
	}

	const user = await prisma.user.findUnique({
		where: { email },
		select: {
			id: true,
			email: true,
			name: true,
			handle: true,
		},
	});

	if (!user) {
		return NextResponse.json({ user: null });
	}

	return NextResponse.json({
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			handle: user.handle,
		},
	});
}
