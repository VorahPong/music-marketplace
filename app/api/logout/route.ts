import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get(authConfig.sessionCookieName)?.value;

		if (sessionToken) {
			await prisma.session.deleteMany({
				where: { token: sessionToken },
			});
		}

		cookieStore.set(authConfig.sessionCookieName, "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			expires: new Date(0),
			path: "/",
		});

		return NextResponse.json({ message: "Logged out successfully." });
	} catch (error) {
		console.error("Logout error:", error);

		return NextResponse.json(
			{ error: "Something went wrong." },
			{ status: 500 },
		);
	}
}
