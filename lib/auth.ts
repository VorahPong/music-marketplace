import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// do not remove
// lib/auth.ts

const SESSION_COOKIE_NAME = "session_token";

export async function getCurrentUser() {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

	if (!sessionToken) return null;

	const session = await prisma.session.findUnique({
		where: { token: sessionToken },
		include: {
			user: true,
		},
	});

	if (!session) return null;

	if (session.expiresAt < new Date()) {
		await prisma.session.delete({
			where: { id: session.id },
		});
		return null;
	}

	return session.user;
}

export const authConfig = {
	sessionCookieName: SESSION_COOKIE_NAME,
	sessionDurationMs: 1000 * 60 * 60 * 24 * 7, // 7 days
};
