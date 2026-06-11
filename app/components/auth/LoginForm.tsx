"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginStep = "credentials" | "twoFactor";

export default function LoginForm() {
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [step, setStep] = useState<LoginStep>("credentials");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setMessage("");
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

			if (data.requiresTwoFactor) {
				setStep("twoFactor");
				setMessage(data.message || "Enter the 6-digit code to finish logging in.");
				return;
			}

			if (data.requiresVerification) {
				setError(
					data.error ||
						"Please verify your email before logging in. Check your verification code.",
				);
				return;
			}

			if (!res.ok) {
				setError(data.error || "Login failed. Please try again.");
				return;
			}

			router.push("/main");
			router.refresh();
		} catch {
			setError("Login failed. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	async function handleVerifyCode(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setMessage("");
		setLoading(true);

		try {
			if (!email || !code) {
				setError("Email and verification code are required.");
				return;
			}

			if (!/^\d{6}$/.test(code)) {
				setError("Verification code must be 6 digits.");
				return;
			}

			const res = await fetch("/api/auth/verify-login-code", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, code }),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Verification failed. Please try again.");
				return;
			}

			router.push("/main");
			router.refresh();
		} catch {
			setError("Verification failed. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	if (step === "twoFactor") {
		return (
			<form onSubmit={handleVerifyCode} className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-white">Enter verification code</h2>
					<p className="mt-2 text-sm text-zinc-400">
						We sent a 6-digit login code to {email}. For now, check your dev
						terminal log.
					</p>
				</div>

				<div>
					<label className="mb-1 block text-sm text-zinc-300">Code</label>
					<input
						type="text"
						value={code}
						onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
						placeholder="123456"
						className="w-full rounded-xl border border-zinc-700 bg-[#FAF8ED] px-4 py-3 text-sm text-black outline-none transition focus:border-zinc-500"
						inputMode="numeric"
						maxLength={6}
						required
					/>
				</div>

				{message && (
					<div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
						{message}
					</div>
				)}

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
					{loading ? "Verifying..." : "Verify and log in"}
				</button>

				<button
					type="button"
					disabled={loading}
					onClick={() => {
						setStep("credentials");
						setCode("");
						setError("");
						setMessage("");
					}}
					className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
				>
					Back to login
				</button>
			</form>
		);
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
					className="w-full rounded-xl border border-zinc-700 bg-[#FAF8ED] px-4 py-3 text-sm text-black outline-none transition focus:border-zinc-500"
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
					className="w-full rounded-xl border border-zinc-700 bg-[#FAF8ED] px-4 py-3 text-sm text-black outline-none transition focus:border-zinc-500"
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
