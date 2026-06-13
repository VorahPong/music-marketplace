import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
// do not remove
// app/main/admin/page.tsx
type DailyMetric = {
	date: string;
	logins: number;
	registrations: number;
	purchases: number;
	revenueCents: number;
};

function formatUsd(cents: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(cents / 100);
}

function getStartOfDay(date: Date) {
	const nextDate = new Date(date);
	nextDate.setHours(0, 0, 0, 0);
	return nextDate;
}

function getDateKey(date: Date) {
	return date.toISOString().slice(0, 10);
}

function formatShortDate(dateKey: string) {
	const date = new Date(`${dateKey}T00:00:00`);

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
	}).format(date);
}

function buildLastSevenDays() {
	const today = getStartOfDay(new Date());

	return Array.from({ length: 7 }, (_, index) => {
		const date = new Date(today);
		date.setDate(today.getDate() - (6 - index));

		return getDateKey(date);
	});
}

function StatCard({
	label,
	value,
	description,
}: {
	label: string;
	value: string | number;
	description: string;
}) {
	return (
		<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
			<p className="text-sm font-medium text-[#D7C0AA]">{label}</p>
			<p className="mt-3 text-3xl font-bold tracking-tight text-white">{value}</p>
			<p className="mt-2 text-sm text-white/55">{description}</p>
		</div>
	);
}

export default async function AdminPage() {
	const user = await getCurrentUser();

	if (!user || user.role !== "ADMIN") {
		redirect("/main");
	}

	const lastSevenDays = buildLastSevenDays();
	const startDate = new Date(`${lastSevenDays[0]}T00:00:00`);

	const [
		totalUsers,
		totalCustomers,
		totalSellers,
		totalAdmins,
		verifiedUsers,
		totalTracks,
		publishedTracks,
		tracksForSale,
		totalPurchases,
		purchaseRevenue,
		recentUsers,
		recentSessions,
		recentPurchases,
		recentTracks,
	] = await Promise.all([
		prisma.user.count(),
		prisma.user.count({ where: { role: "CUSTOMER" } }),
		prisma.user.count({ where: { role: "SELLER" } }),
		prisma.user.count({ where: { role: "ADMIN" } }),
		prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
		prisma.track.count({ where: { deletedAt: null } }),
		prisma.track.count({ where: { deletedAt: null, isPublished: true } }),
		prisma.track.count({ where: { deletedAt: null, isForSale: true } }),
		prisma.trackPurchase.count(),
		prisma.trackPurchase.aggregate({ _sum: { amountCents: true } }),
		prisma.user.findMany({
			where: { createdAt: { gte: startDate } },
			select: { id: true, createdAt: true },
		}),
		prisma.session.findMany({
			where: { createdAt: { gte: startDate } },
			select: { id: true, createdAt: true },
		}),
		prisma.trackPurchase.findMany({
			where: { createdAt: { gte: startDate } },
			select: { id: true, createdAt: true, amountCents: true },
		}),
		prisma.track.findMany({
			where: { createdAt: { gte: startDate }, deletedAt: null },
			select: { id: true, createdAt: true },
		}),
	]);

	const dailyMetrics = lastSevenDays.reduce<Record<string, DailyMetric>>((acc, date) => {
		acc[date] = {
			date,
			logins: 0,
			registrations: 0,
			purchases: 0,
			revenueCents: 0,
		};

		return acc;
	}, {});

	for (const session of recentSessions) {
		const dateKey = getDateKey(session.createdAt);
		if (dailyMetrics[dateKey]) {
			dailyMetrics[dateKey].logins += 1;
		}
	}

	for (const recentUser of recentUsers) {
		const dateKey = getDateKey(recentUser.createdAt);
		if (dailyMetrics[dateKey]) {
			dailyMetrics[dateKey].registrations += 1;
		}
	}

	for (const purchase of recentPurchases) {
		const dateKey = getDateKey(purchase.createdAt);
		if (dailyMetrics[dateKey]) {
			dailyMetrics[dateKey].purchases += 1;
			dailyMetrics[dateKey].revenueCents += purchase.amountCents;
		}
	}

	const activityRows = Object.values(dailyMetrics);
	const totalRevenueCents = purchaseRevenue._sum.amountCents ?? 0;
	const recentTrackCount = recentTracks.length;
	const verificationRate = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

	return (
		<main className="min-h-screen bg-[#120C08] px-4 py-8 text-white sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl space-y-8">
				<section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#2B1B12] via-[#1B110C] to-[#0E0906] p-6 shadow-2xl shadow-black/25 sm:p-8">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D7C0AA]">
								Admin Dashboard
							</p>
							<h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
								Music Marketplace Analytics
							</h1>
							<p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
								Monitor users, logins, tracks, purchases, and revenue from one admin-only page.
							</p>
						</div>

						<div className="rounded-2xl border border-[#D7C0AA]/20 bg-[#D7C0AA]/10 px-4 py-3 text-sm text-[#F6E7D8]">
							Signed in as <span className="font-semibold">{user.email}</span>
						</div>
					</div>
				</section>

				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<StatCard label="Total Users" value={totalUsers} description={`${verificationRate}% verified accounts`} />
					<StatCard label="Total Tracks" value={totalTracks} description={`${publishedTracks} published · ${tracksForSale} for sale`} />
					<StatCard label="Total Purchases" value={totalPurchases} description={`${formatUsd(totalRevenueCents)} total revenue`} />
					<StatCard label="Recent Uploads" value={recentTrackCount} description="Tracks uploaded in the last 7 days" />
				</section>

				<section className="grid gap-4 lg:grid-cols-3">
					<StatCard label="Customers" value={totalCustomers} description="Default role for new registrations" />
					<StatCard label="Sellers" value={totalSellers} description="Users allowed to upload and sell" />
					<StatCard label="Admins" value={totalAdmins} description="Users allowed to view analytics" />
				</section>

				<section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-xl shadow-black/10">
					<div className="border-b border-white/10 px-6 py-5">
						<h2 className="text-xl font-bold tracking-tight text-white">Last 7 Days</h2>
						<p className="mt-1 text-sm text-white/55">
							Daily logins are counted from new session records.
						</p>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[720px] text-left text-sm">
							<thead className="bg-white/[0.03] text-xs uppercase tracking-[0.2em] text-white/45">
								<tr>
									<th className="px-6 py-4 font-semibold">Date</th>
									<th className="px-6 py-4 font-semibold">Logins</th>
									<th className="px-6 py-4 font-semibold">Registrations</th>
									<th className="px-6 py-4 font-semibold">Purchases</th>
									<th className="px-6 py-4 font-semibold">Revenue</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/10">
								{activityRows.map((row) => (
									<tr key={row.date} className="text-white/75">
										<td className="px-6 py-4 font-medium text-white">{formatShortDate(row.date)}</td>
										<td className="px-6 py-4">{row.logins}</td>
										<td className="px-6 py-4">{row.registrations}</td>
										<td className="px-6 py-4">{row.purchases}</td>
										<td className="px-6 py-4">{formatUsd(row.revenueCents)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</main>
	);
}