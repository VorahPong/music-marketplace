"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { AtSign, CheckCircle2, Loader2, Lock, Mail, ShieldCheck, User, XCircle } from "lucide-react";
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

	const inputClass =
		"w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 pl-11 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#EAD9C7]/70 focus:bg-white/[0.09]";

	if (step === "verify") {
		return (
			<form onSubmit={handleVerifyRegisterCode} className="space-y-5">
				<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF8ED] text-[#4E3523] shadow-lg shadow-black/20">
						<ShieldCheck size={26} />
					</div>
					<div className="mt-4 text-center">
						<h2 className="text-2xl font-bold text-white">Verify your email</h2>
						<p className="mt-2 text-sm leading-6 text-zinc-400">
							We sent a 6-digit code to <span className="font-medium text-[#FAF8ED]">{email}</span>.
							 Enter it below to activate your account.
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
					<p className="mt-2 text-center text-xs text-zinc-500">
						For local testing, the code is also printed in your dev terminal.
					</p>
				</div>

				{error && (
					<div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
						<XCircle className="mt-0.5 shrink-0" size={16} />
						<span>{error}</span>
					</div>
				)}

				{success && (
					<div className="flex items-start gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
						<CheckCircle2 className="mt-0.5 shrink-0" size={16} />
						<span>{success}</span>
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FAF8ED] px-4 py-3.5 text-sm font-bold text-[#4E3523] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
				>
					{loading && <Loader2 className="animate-spin" size={16} />}
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
					className="w-full rounded-2xl border border-white/10 px-4 py-3.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
				>
					Back to register
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
						<h2 className="text-xl font-bold text-white">Create your account</h2>
						<p className="mt-1 text-sm leading-6 text-zinc-400">
							Join the marketplace, save purchases, and verify your email with a secure code.
						</p>
					</div>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label className="mb-2 block text-sm font-medium text-zinc-300">Name</label>
					<div className="relative">
						<User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
							className={inputClass}
						/>
					</div>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium text-zinc-300">Handle</label>
					<div className="relative">
						<AtSign className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
						<input
							type="text"
							value={handle}
							onChange={(e) => setHandle(e.target.value.toLowerCase())}
							placeholder="yourusername"
							className={inputClass}
							required
						/>
					</div>

					<div className="mt-2 min-h-5">
						{handle && checkingHandle && (
							<p className="flex items-center gap-1.5 text-xs text-zinc-400">
								<Loader2 className="animate-spin" size={13} />
								Checking handle...
							</p>
						)}

						{handle && !checkingHandle && handleAvailable === true && (
							<p className="flex items-center gap-1.5 text-xs text-green-300">
								<CheckCircle2 size={13} />
								Handle is available
							</p>
						)}

						{handle && !checkingHandle && handleAvailable === false && (
							<p className="flex items-center gap-1.5 text-xs text-red-300">
								<XCircle size={13} />
								Handle is already taken
							</p>
						)}
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
						placeholder="Create a secure password"
						className={inputClass}
						required
					/>
				</div>
			</div>

			<div className="rounded-2xl border border-[#EAD9C7]/15 bg-[#FAF8ED]/[0.06] px-4 py-3">
				<p className="text-xs leading-5 text-zinc-400">
					Your public channel will be available at{" "}
					<span className="font-medium text-[#FAF8ED]">
						/main/channel/{handle || "yourusername"}
					</span>
				</p>
			</div>

			{error && (
				<div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
					<XCircle className="mt-0.5 shrink-0" size={16} />
					<span>{error}</span>
				</div>
			)}

			{success && (
				<div className="flex items-start gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
					<CheckCircle2 className="mt-0.5 shrink-0" size={16} />
					<span>{success}</span>
				</div>
			)}

			<button
				type="submit"
				disabled={loading}
				className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FAF8ED] px-4 py-3.5 text-sm font-bold text-[#4E3523] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
			>
				{loading && <Loader2 className="animate-spin" size={16} />}
				{loading ? "Creating account..." : "Create account"}
			</button>

			<p className="text-center text-sm text-zinc-400">
				Already have an account?{" "}
				<Link href="/auth/login" className="font-medium text-[#FAF8ED] hover:underline">
					Log in
				</Link>
			</p>
		</form>
	);
}
