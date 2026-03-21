"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterForm() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);

		try {
			const res = await fetch("/api/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name,
					email,
					password,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Something went wrong.");
				return;
			}

			setSuccess("Account created successfully. You can now log in.");
			setName("");
			setEmail("");
			setPassword("");
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label className="mb-1 block text-sm text-zinc-300">Name</label>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Your name"
					className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
				/>
			</div>

			<div>
				<label className="mb-1 block text-sm text-zinc-300">Email</label>
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="you@example.com"
					className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
					required
				/>
			</div>

			<div>
				<label className="mb-1 block text-sm text-zinc-300">Password</label>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Create a password"
					className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
					required
				/>
			</div>

			{error && (
				<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
					{error}
				</div>
			)}

			{success && (
				<div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
					{success}
				</div>
			)}

			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{loading ? "Creating account..." : "Create account"}
			</button>

			<p className="text-center text-sm text-zinc-400">
				Already have an account?{" "}
				<Link href="/auth/login" className="text-white hover:underline">
					Log in
				</Link>
			</p>
		</form>
	);
}
