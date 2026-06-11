// app/components/auth/ForgotPasswordForm.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
	CheckCircle2,
	Loader2,
	Lock,
	Mail,
	ShieldCheck,
	XCircle,
} from "lucide-react";

type ForgotPasswordStep = "request" | "reset";

export default function ForgotPasswordForm() {
	const [step, setStep] = useState<ForgotPasswordStep>("request");
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	const inputClass =
		"w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 pl-11 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#EAD9C7]/70 focus:bg-white/[0.09]";

	async function handleRequestCode(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setMessage("");
		setLoading(true);

		try {
			const cleanedEmail = email.trim().toLowerCase();

			if (!cleanedEmail) {
				setError("Email is required.");
				return;
			}

			const res = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email: cleanedEmail }),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Unable to send reset code.");
				return;
			}

			setEmail(cleanedEmail);
			setMessage(data.message || "If an account exists, a reset code has been sent.");
			setStep("reset");
		} catch {
			setError("Unable to send reset code. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setMessage("");
		setLoading(true);

		try {
			const cleanedEmail = email.trim().toLowerCase();

			if (!cleanedEmail || !code.trim() || !password || !confirmPassword) {
				setError("All fields are required.");
				return;
			}

			if (!/^\d{6}$/.test(code)) {
				setError("Reset code must be 6 digits.");
				return;
			}

			if (password.length < 8) {
				setError("Password must be at least 8 characters.");
				return;
			}

			if (password !== confirmPassword) {
				setError("Passwords do not match.");
				return;
			}

			const res = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: cleanedEmail,
					code,
					password,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Unable to reset password.");
				return;
			}

			setMessage(data.message || "Password reset successfully.");
			setCode("");
			setPassword("");
			setConfirmPassword("");
		} catch {
			setError("Unable to reset password. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	if (step === "reset") {
		return (
			<form onSubmit={handleResetPassword} className="space-y-5">
				<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF8ED] text-[#4E3523] shadow-lg shadow-black/20">
						<ShieldCheck size={26} />
					</div>
					<div className="mt-4 text-center">
						<h2 className="text-2xl font-bold text-white">Reset your password</h2>
						<p className="mt-2 text-sm leading-6 text-zinc-400">
							Enter the 6-digit code sent to{" "}
							<span className="font-medium text-[#FAF8ED]">{email}</span>, then choose a new password.
						</p>
					</div>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium text-zinc-300">Reset code</label>
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
					<p className="mt-2 text-center text-xs text-zinc-500">
						For local testing, the code is also printed in your dev terminal.
					</p>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium text-zinc-300">New password</label>
					<div className="relative">
						<Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="At least 8 characters"
							className={inputClass}
							required
						/>
					</div>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium text-zinc-300">Confirm password</label>
					<div className="relative">
						<Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
						<input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Re-enter new password"
							className={inputClass}
							required
						/>
					</div>
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
					{loading ? "Resetting password..." : "Reset password"}
				</button>

				<button
					type="button"
					disabled={loading}
					onClick={() => {
						setStep("request");
						setCode("");
						setPassword("");
						setConfirmPassword("");
						setError("");
						setMessage("");
					}}
					className="w-full rounded-2xl border border-white/10 px-4 py-3.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
				>
					Use a different email
				</button>

				<p className="text-center text-sm text-zinc-400">
					Remember your password?{" "}
					<Link href="/auth/login" className="font-medium text-[#FAF8ED] hover:underline">
						Log in
					</Link>
				</p>
			</form>
		);
	}

	return (
		<form onSubmit={handleRequestCode} className="space-y-5">
			<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
				<div className="flex items-start gap-4">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FAF8ED] text-[#4E3523] shadow-lg shadow-black/20">
						<ShieldCheck size={23} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-white">Forgot password?</h2>
						<p className="mt-1 text-sm leading-6 text-zinc-400">
							Enter your account email and we&apos;ll send you a secure reset code.
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

			<div className="rounded-2xl border border-[#EAD9C7]/15 bg-[#FAF8ED]/[0.06] px-4 py-3">
				<p className="text-xs leading-5 text-zinc-400">
					For security, reset codes expire in 10 minutes and can only be used once.
				</p>
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
				{loading ? "Sending code..." : "Send reset code"}
			</button>

			<p className="text-center text-sm text-zinc-400">
				Remember your password?{" "}
				<Link href="/auth/login" className="font-medium text-[#FAF8ED] hover:underline">
					Log in
				</Link>
			</p>
		</form>
	);
}