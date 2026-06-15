"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Lock, Mail, ShieldCheck, XCircle } from "lucide-react";

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

	const inputClass =
		"w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 pl-11 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#EAD9C7]/70 focus:bg-white/[0.09]";

	function resetToCredentialsStep() {
		setStep("credentials");
		setPassword("");
		setCode("");
		setError("");
		setMessage("");
	}

	if (step === "twoFactor") {
		return (
			<form onSubmit={handleVerifyCode} className="space-y-5">
				<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF8ED] text-[#4E3523] shadow-lg shadow-black/20">
						<ShieldCheck size={26} />
					</div>
					<div className="mt-4 text-center">
						<h2 className="text-2xl font-bold text-white">Check your email</h2>
						<p className="mt-2 text-sm leading-6 text-zinc-400">
							We sent a 6-digit login code to{" "}
							<span className="font-medium text-[#FAF8ED]">{email}</span>. Enter it below to finish signing in.
						</p>
					</div>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium text-zinc-300">Verification code</label>
					<input
						type="text"
						value={code}
						onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
						placeholder="000000"
						className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-center text-2xl font-bold tracking-[0.45em] text-white placeholder:text-zinc-600 outline-none transition focus:border-[#EAD9C7]/70 focus:bg-white/[0.09]"
						inputMode="numeric"
						maxLength={6}
						required
					/>
				</div>

				{message && (
					<div className="flex items-start gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
						<CheckCircle2 className="mt-0.5 shrink-0" size={16} />
						<span>{message}</span>
					</div>
				)}

				{error && (
					<div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
						<XCircle className="mt-0.5 shrink-0" size={16} />
						<span>{error}</span>
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FAF8ED] px-4 py-3.5 text-sm font-bold text-[#4E3523] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
				>
					{loading && <Loader2 className="animate-spin" size={16} />}
					{loading ? "Verifying..." : "Verify and log in"}
				</button>

				<button
					type="button"
					disabled={loading}
					onClick={resetToCredentialsStep}
					className="w-full rounded-2xl border border-white/10 px-4 py-3.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
				>
					Back to login form
				</button>
			</form>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
				<div className="flex items-start gap-4">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FAF8ED] text-[#4E3523] shadow-lg shadow-black/20">
						<ShieldCheck size={23} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-white">Welcome back</h2>
						<p className="mt-1 text-sm leading-6 text-zinc-400">
							Log in to manage your music, purchases, downloads, and account.
						</p>
					</div>
				</div>
			</div>

			<div>
				<label className="mb-2 block text-sm font-medium text-zinc-300">Email</label>
				<div className="relative">
					<Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						className={inputClass}
						required
					/>
				</div>
			</div>

			<div>
				<label className="mb-2 block text-sm font-medium text-zinc-300">Password</label>
				<div className="relative">
					<Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Enter your password"
						className={inputClass}
						required
					/>
				</div>

				<div className="mt-2 text-right">
					<Link
						href="/auth/forgot-password"
						className="text-xs font-medium text-[#FAF8ED] hover:underline"
					>
						Forgot password?
					</Link>
				</div>
			</div>

			<div className="rounded-2xl border border-[#EAD9C7]/15 bg-[#FAF8ED]/[0.06] px-4 py-3">
				<p className="text-xs leading-5 text-zinc-400">
					For security, we may send a 6-digit code to your email before completing login.
				</p>
			</div>

			{error && (
				<div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
					<XCircle className="mt-0.5 shrink-0" size={16} />
					<span>{error}</span>
				</div>
			)}

			<button
				type="submit"
				disabled={loading}
				className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FAF8ED] px-4 py-3.5 text-sm font-bold text-[#4E3523] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
			>
				{loading && <Loader2 className="animate-spin" size={16} />}
				{loading ? "Logging in..." : "Log in"}
			</button>

			<p className="text-center text-sm text-zinc-400">
				Don&apos;t have an account?{" "}
				<Link href="/auth/register" className="font-medium text-[#FAF8ED] hover:underline">
					Create one
				</Link>
			</p>
		</form>
	);
}
