import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const { handlers, signIn, signOut, auth } = NextAuth({
	session: {
		strategy: "jwt",
	},
	providers: [
		Credentials({
			credentials: {
				email: {},
				password: {},
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;

				const user = await prisma.user.findUnique({
					where: { email: String(credentials.email) },
				});

				if (!user?.passwordHash) return null;

				const ok = await bcrypt.compare(
					String(credentials.password),
					user.passwordHash,
				);

				if (!ok) return null;

				return {
					id: user.id,
					email: user.email,
					name: user.name,
				};
			},
		}),
	],
});
