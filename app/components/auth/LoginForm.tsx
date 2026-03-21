"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			if (!email || !password) {
				setError("Email and password are required.");
				return;
			}

			const res = await fetch("/api/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});
			
			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Login failed. Please try again.");
				return;
			}

			router.push("/dashboard");
		} catch {
			setError("Login failed. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label className="mb-1 block text-sm text-zinc-300">Email</label>
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="you@example.com"
					className="w-full rounded-xl border border-zinc-700 bg-[#4FAF8ED] px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
					required
				/>
			</div>

			<div>
				<label className="mb-1 block text-sm text-zinc-300">Password</label>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Enter your password"
					className="w-full rounded-xl border border-zinc-700 bg-[#4FAF8ED] px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
					required
				/>
			</div>

			{error && (
				<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
					{error}
				</div>
			)}

			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{loading ? "Logging in..." : "Log in"}
			</button>

			<p className="text-center text-sm text-zinc-400">
				Don&apos;t have an account?{" "}
				<Link href="/auth/register" className="text-white hover:underline">
					Create one
				</Link>
			</p>
		</form>
	);
}
