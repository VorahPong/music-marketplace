"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
// app/components/auth/RegisterForm.tsx

type RegisterStep = "register" | "verify";

export default function RegisterForm() {
	const [name, setName] = useState("");
	const [handle, setHandle] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [step, setStep] = useState<RegisterStep>("register");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
	const [checkingHandle, setCheckingHandle] = useState(false);

	useEffect(() => {
		if (!handle.trim()) {
			setHandleAvailable(null);
			setCheckingHandle(false);
			return;
		}

		setCheckingHandle(true);

		const timeout = setTimeout(async () => {
			try {
				const res = await fetch(`/api/handle-available?handle=${handle}`);
				const data = await res.json();
				setHandleAvailable(data.available);
			} catch {
				setHandleAvailable(null);
			} finally {
				setCheckingHandle(false);
			}
		}, 400);

		return () => clearTimeout(timeout);
	}, [handle]);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);

		if (checkingHandle) {
			setError("Please wait while we check your handle.");
			setLoading(false);
			return;
		}

		if (handleAvailable === false) {
			setError("Handle is already taken.");
			setLoading(false);
			return;
		}

		try {
			if (!handle.trim()) {
				setError("Handle is required.");
				setLoading(false);
				return;
			}

			const res = await fetch("/api/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name,
					handle,
					email,
					password,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Something went wrong.");
				return;
			}

			if (data.requiresVerification) {
				setStep("verify");
				setSuccess(
					data.message ||
						"Account created successfully. Enter the 6-digit verification code.",
				);
				setPassword("");
				return;
			}

			setSuccess("Account created successfully. Redirecting to login...");
			setName("");
			setHandle("");
			setEmail("");
			setPassword("");

			setTimeout(() => {
				window.location.href = "/auth/login";
			}, 2000);
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	async function handleVerifyRegisterCode(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setSuccess("");
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

			const res = await fetch("/api/auth/verify-register-code", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					code,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Verification failed. Please try again.");
				return;
			}

			setSuccess(data.message || "Email verified successfully. Redirecting to login...");
			setCode("");

			setTimeout(() => {
				window.location.href = "/auth/login";
			}, 1500);
		} catch {
			setError("Verification failed. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	if (step === "verify") {
		return (
			<form onSubmit={handleVerifyRegisterCode} className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-white">Verify your email</h2>
					<p className="mt-2 text-sm text-zinc-400">
						Enter the 6-digit code for {email}. For now, check your dev terminal
						log.
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
					{loading ? "Verifying..." : "Verify email"}
				</button>

				<button
					type="button"
					disabled={loading}
					onClick={() => {
						setStep("register");
						setCode("");
						setError("");
						setSuccess("");
					}}
					className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
				>
					Back to register
				</button>
			</form>
		);
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
					className="w-full rounded-xl border border-zinc-700 bg-[#FAF8ED] px-4 py-3 text-sm text-black outline-none transition focus:border-zinc-500"
				/>
			</div>

			<div>
				<label className="mb-1 block text-sm text-zinc-300">Handle</label>
				<input
					type="text"
					value={handle}
					onChange={(e) => setHandle(e.target.value.toLowerCase())}
					placeholder="yourusername"
					className="w-full rounded-xl border border-zinc-700 bg-[#FAF8ED] px-4 py-3 text-sm text-black outline-none transition focus:border-zinc-500"
					required
				/>
				{handle && checkingHandle && (
					<p className="mt-1 text-xs text-zinc-400">Checking handle...</p>
				)}

				{handle && !checkingHandle && handleAvailable === true && (
					<p className="mt-1 text-xs text-green-400">✔ Handle is available</p>
				)}

				{handle && !checkingHandle && handleAvailable === false && (
					<p className="mt-1 text-xs text-red-400">✖ Handle is already taken</p>
				)}
				<p className="mt-1 text-xs text-zinc-500">
					This will be your public URL (e.g. /main/channel/yourusername)
				</p>
			</div>

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
					placeholder="Create a password"
					className="w-full rounded-xl border border-zinc-700 bg-[#FAF8ED] px-4 py-3 text-sm text-black outline-none transition focus:border-zinc-500"
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
