// do not remove
// app/settings/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { AtSign, Lock, Mail, Settings, ShieldCheck, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";


type SettingsPageProps = {
	searchParams?: Promise<{
		saved?: string;
		error?: string;
	}>;
};

function formatRole(role: string) {
	return role.charAt(0) + role.slice(1).toLowerCase();
}


export default async function SettingsPage({ searchParams }: SettingsPageProps) {
	const user = await getCurrentUser();
	const resolvedSearchParams = await searchParams;

	if (!user) {
		redirect("/auth/login");
	}

	const savedMessage = resolvedSearchParams?.saved;
	const errorMessage = resolvedSearchParams?.error;

	return (
		<main className="min-h-screen bg-[#FAF8ED] px-6 py-10 text-[#4E3523]">
			<section className="mx-auto max-w-4xl">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<div className="flex items-center gap-3">
							<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
								<Settings size={22} />
							</div>
							<h1 className="text-3xl font-bold">Settings</h1>
						</div>
						<p className="mt-3 text-[#4E3523]/70">
							Manage your public profile information and account details.
						</p>
					</div>

					<Link
						href={`/main/channel/${user.handle}`}
						className="rounded-full bg-[#4E3523] px-5 py-3 text-sm font-semibold text-[#FAF8ED]"
					>
						View Channel
					</Link>
				</div>

				{savedMessage && (
					<div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
						{savedMessage}
					</div>
				)}

				{errorMessage && (
					<div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
						{errorMessage}
					</div>
				)}

				<div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
					<div className="rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
						<h2 className="text-xl font-bold">Profile Settings</h2>
						<p className="mt-2 text-sm text-[#4E3523]/70">
							This information appears on your public channel and around the marketplace.
						</p>

						<div className="mt-6 space-y-5">
							<div>
								<label className="mb-2 flex items-center gap-2 text-sm font-semibold">
									<User size={16} />
									Display Name
								</label>
								<input
									type="text"
									value={user.name ?? ""}
									readOnly
									placeholder="Your display name"
									className="w-full cursor-not-allowed rounded-xl border border-[#D6CFC7] bg-[#FAF8ED] px-4 py-3 text-sm text-[#4E3523]/70 outline-none"
								/>
								<p className="mt-1 text-xs text-[#4E3523]/60">
									Profile changes are currently disabled.
								</p>
							</div>

							<div>
								<label className="mb-2 flex items-center gap-2 text-sm font-semibold">
									<AtSign size={16} />
									Handle
								</label>
								<div className="flex overflow-hidden rounded-xl border border-[#D6CFC7] focus-within:border-[#4E3523]">
									<span className="flex items-center bg-[#FAF8ED] px-4 text-sm text-[#4E3523]/60">
										@</span>
									<input
										type="text"
										value={user.handle}
										readOnly
										className="w-full cursor-not-allowed bg-[#FAF8ED] px-4 py-3 text-sm text-[#4E3523]/70 outline-none"
									/>
								</div>
								<p className="mt-1 text-xs text-[#4E3523]/60">
									Handle changes are currently disabled.
								</p>
							</div>

							<div>
								<label className="mb-2 flex items-center gap-2 text-sm font-semibold">
									<Mail size={16} />
									Email
								</label>
								<input
									type="email"
									value={user.email}
									readOnly
									className="w-full rounded-xl border border-[#D6CFC7] bg-[#FAF8ED] px-4 py-3 text-sm text-[#4E3523]/70 outline-none"
								/>
								<p className="mt-1 text-xs text-[#4E3523]/60">
									Email changes can be added later with verification.
								</p>
							</div>
						</div>

						<button
							type="button"
							disabled
							className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#4E3523]/40 px-4 py-3 text-sm font-semibold text-[#FAF8ED]"
						>
							<Lock size={16} />
							Profile Editing Disabled
						</button>
					</div>

					<aside className="space-y-6">
						<div className="rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
							<h2 className="text-xl font-bold">Account</h2>
							<div className="mt-5 space-y-4">
								<div className="rounded-2xl bg-[#FAF8ED] p-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-[#4E3523]/50">
										Account Role
									</p>
									<div className="mt-2 flex items-center gap-2 font-semibold">
										<ShieldCheck size={18} />
										{formatRole(user.role)}
									</div>
								</div>

								<div className="rounded-2xl bg-[#FAF8ED] p-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-[#4E3523]/50">
										Channel URL
									</p>
									<p className="mt-2 break-all text-sm font-medium">
										/main/channel/{user.handle}
									</p>
								</div>
							</div>
						</div>

						{/* <div className="rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
							<h2 className="text-xl font-bold">Coming Later</h2>
							<ul className="mt-4 space-y-3 text-sm text-[#4E3523]/70">
								<li>• Change email with verification</li>
								<li>• Change password</li>
								<li>• Seller payout settings</li>
								<li>• Notification preferences</li>
							</ul>
						</div> */}
					</aside>
				</div>
			</section>
		</main>
	);
}