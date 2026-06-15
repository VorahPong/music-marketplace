// do not remove
// app/main/dashboard/analytics/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, DollarSign, Download, Music2, ShoppingBag, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function formatMoney(amountCents: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(amountCents / 100);
}

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function formatVersion(version: string) {
	return version === "FULL" ? "Full ZIP" : "Regular WAV";
}

export default async function SellerAnalyticsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "SELLER" && user.role !== "ADMIN") {
		redirect("/main");
	}

	const purchases = await prisma.trackPurchase.findMany({
		where: {
			track: {
				ownerId: user.id,
			},
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					handle: true,
					email: true,
				},
			},
			track: {
				select: {
					id: true,
					title: true,
					trackType: true,
					isPublished: true,
					deletedAt: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	const totalRevenueCents = purchases.reduce(
		(total, purchase) => total + purchase.amountCents,
		0,
	);
	const totalSales = purchases.length;
	const regularSales = purchases.filter(
		(purchase) => purchase.version === "REGULAR",
	).length;
	const fullSales = purchases.filter(
		(purchase) => purchase.version === "FULL",
	).length;
	const uniqueBuyerCount = new Set(purchases.map((purchase) => purchase.userId)).size;

	const trackStatsMap = new Map<
		string,
		{
			id: string;
			title: string;
			trackType: string;
			isPublished: boolean;
			deletedAt: Date | null;
			revenueCents: number;
			totalSales: number;
			regularSales: number;
			fullSales: number;
		}
	>();

	for (const purchase of purchases) {
		const current = trackStatsMap.get(purchase.track.id) ?? {
			id: purchase.track.id,
			title: purchase.track.title,
			trackType: purchase.track.trackType,
			isPublished: purchase.track.isPublished,
			deletedAt: purchase.track.deletedAt,
			revenueCents: 0,
			totalSales: 0,
			regularSales: 0,
			fullSales: 0,
		};

		current.revenueCents += purchase.amountCents;
		current.totalSales += 1;

		if (purchase.version === "REGULAR") {
			current.regularSales += 1;
		}

		if (purchase.version === "FULL") {
			current.fullSales += 1;
		}

		trackStatsMap.set(purchase.track.id, current);
	}

	const topTracks = Array.from(trackStatsMap.values()).sort((a, b) => {
		if (b.revenueCents !== a.revenueCents) {
			return b.revenueCents - a.revenueCents;
		}

		return b.totalSales - a.totalSales;
	});

	const statCards = [
		{
			label: "Gross Revenue",
			value: formatMoney(totalRevenueCents),
			description: "Before PayPal fees or refunds.",
			icon: DollarSign,
		},
		{
			label: "Total Sales",
			value: String(totalSales),
			description: "All paid regular and full purchases.",
			icon: ShoppingBag,
		},
		{
			label: "Regular WAV Sales",
			value: String(regularSales),
			description: "Customers who bought the regular version.",
			icon: Download,
		},
		{
			label: "Full ZIP Sales",
			value: String(fullSales),
			description: "Customers who bought the full version.",
			icon: Music2,
		},
		{
			label: "Unique Buyers",
			value: String(uniqueBuyerCount),
			description: "Different customer accounts that purchased.",
			icon: Users,
		},
	];

	return (
		<main className="min-h-screen bg-[#FAF8ED] px-6 py-10 text-[#4E3523]">
			<section className="mx-auto max-w-6xl">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<div className="flex items-center gap-3">
							<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
								<BarChart3 size={22} />
							</div>
							<h1 className="text-3xl font-bold">Seller Analytics</h1>
						</div>
						<p className="mt-3 text-[#4E3523]/70">
							See who bought your tracks, how many sales you have, and your gross revenue.
						</p>
					</div>

					<Link
						href="/main/dashboard/create"
						className="rounded-full bg-[#4E3523] px-5 py-3 text-sm font-semibold text-[#FAF8ED]"
					>
						Upload New Track
					</Link>
				</div>

				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
					{statCards.map((card) => {
						const Icon = card.icon;

						return (
							<div
								key={card.label}
								className="rounded-3xl border border-[#D6CFC7] bg-white p-5 shadow-sm"
							>
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm font-medium text-[#4E3523]/70">{card.label}</p>
									<div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF8ED]">
										<Icon size={18} />
									</div>
								</div>
								<p className="mt-4 text-2xl font-bold">{card.value}</p>
								<p className="mt-2 text-xs leading-5 text-[#4E3523]/60">
									{card.description}
								</p>
							</div>
						);
					})}
				</div>

				<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
					<section className="rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
						<div className="flex items-center justify-between gap-3">
							<div>
								<h2 className="text-xl font-bold">Top Tracks</h2>
								<p className="mt-1 text-sm text-[#4E3523]/60">
									Ranked by gross revenue.
								</p>
							</div>
						</div>

						{topTracks.length === 0 ? (
							<div className="mt-6 rounded-2xl bg-[#FAF8ED] p-5 text-sm text-[#4E3523]/70">
								No sales yet. Once customers buy your tracks, your top sellers will show here.
							</div>
						) : (
							<div className="mt-5 space-y-3">
								{topTracks.slice(0, 5).map((track, index) => (
									<Link
										key={track.id}
										href={`/main/song/${track.id}`}
										className="block rounded-2xl border border-[#D6CFC7] p-4 hover:bg-[#FAF8ED]"
									>
										<div className="flex items-start justify-between gap-4">
											<div className="min-w-0">
												<p className="text-xs font-semibold text-[#4E3523]/50">#{index + 1}</p>
												<h3 className="mt-1 truncate font-semibold">{track.title}</h3>
												<p className="mt-1 text-xs text-[#4E3523]/60">
													{track.trackType} • {track.totalSales} sale{track.totalSales === 1 ? "" : "s"}
												</p>
												{!track.isPublished && (
													<p className="mt-2 inline-flex rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
														Unpublished
													</p>
												)}
											</div>
											<p className="shrink-0 font-bold">{formatMoney(track.revenueCents)}</p>
										</div>
									</Link>
								))}
							</div>
						)}
					</section>

					<section className="rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
						<div>
							<h2 className="text-xl font-bold">Recent Buyers</h2>
							<p className="mt-1 text-sm text-[#4E3523]/60">
								Latest purchases from your customers.
							</p>
						</div>

						{purchases.length === 0 ? (
							<div className="mt-6 rounded-2xl bg-[#FAF8ED] p-5 text-sm text-[#4E3523]/70">
								No buyers yet. Purchase history will appear here after your first sale.
							</div>
						) : (
							<div className="mt-5 overflow-hidden rounded-2xl border border-[#D6CFC7]">
								<div className="overflow-x-auto">
									<table className="w-full min-w-[720px] text-left text-sm">
										<thead className="bg-[#FAF8ED] text-xs uppercase tracking-wide text-[#4E3523]/60">
											<tr>
												<th className="px-4 py-3 font-semibold">Date</th>
												<th className="px-4 py-3 font-semibold">Buyer</th>
												<th className="px-4 py-3 font-semibold">Track</th>
												<th className="px-4 py-3 font-semibold">Version</th>
												<th className="px-4 py-3 text-right font-semibold">Amount</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-[#D6CFC7]">
											{purchases.slice(0, 15).map((purchase) => (
												<tr key={purchase.id} className="hover:bg-[#FAF8ED]/60">
													<td className="px-4 py-4 text-[#4E3523]/70">
														{formatDate(purchase.createdAt)}
													</td>
													<td className="px-4 py-4">
														<p className="font-medium">
															{purchase.user.name || purchase.user.handle || "Customer"}
														</p>
														<p className="text-xs text-[#4E3523]/60">{purchase.user.email}</p>
													</td>
													<td className="px-4 py-4">
														<Link href={`/main/song/${purchase.track.id}`} className="font-medium hover:underline">
															{purchase.track.title}
														</Link>
														<p className="text-xs text-[#4E3523]/60">{purchase.track.trackType}</p>
													</td>
													<td className="px-4 py-4">
														<span className="rounded-full bg-[#FAF8ED] px-3 py-1 text-xs font-semibold">
															{formatVersion(purchase.version)}
														</span>
													</td>
													<td className="px-4 py-4 text-right font-bold">
														{formatMoney(purchase.amountCents)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</section>
				</div>

				<section className="mt-8 rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<h2 className="text-xl font-bold">Sales by Track</h2>
							<p className="mt-1 text-sm text-[#4E3523]/60">
								See exactly how each beat or track is performing.
							</p>
						</div>
					</div>

					{topTracks.length === 0 ? (
						<div className="mt-6 rounded-2xl bg-[#FAF8ED] p-5 text-sm text-[#4E3523]/70">
							No per-track sales yet. Once a customer buys a beat, it will show here.
						</div>
					) : (
						<div className="mt-5 overflow-hidden rounded-2xl border border-[#D6CFC7]">
							<div className="overflow-x-auto">
								<table className="w-full min-w-[760px] text-left text-sm">
									<thead className="bg-[#FAF8ED] text-xs uppercase tracking-wide text-[#4E3523]/60">
										<tr>
											<th className="px-4 py-3 font-semibold">Track</th>
											<th className="px-4 py-3 font-semibold">Type</th>
											<th className="px-4 py-3 text-right font-semibold">Regular WAV</th>
											<th className="px-4 py-3 text-right font-semibold">Full ZIP</th>
											<th className="px-4 py-3 text-right font-semibold">Total Sales</th>
											<th className="px-4 py-3 text-right font-semibold">Revenue</th>
											<th className="px-4 py-3 font-semibold">Status</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#D6CFC7]">
										{topTracks.map((track) => (
											<tr key={track.id} className="hover:bg-[#FAF8ED]/60">
												<td className="px-4 py-4">
													<Link href={`/main/song/${track.id}`} className="font-semibold hover:underline">
														{track.title}
													</Link>
												</td>
												<td className="px-4 py-4 text-[#4E3523]/70">{track.trackType}</td>
												<td className="px-4 py-4 text-right font-medium">{track.regularSales}</td>
												<td className="px-4 py-4 text-right font-medium">{track.fullSales}</td>
												<td className="px-4 py-4 text-right font-bold">{track.totalSales}</td>
												<td className="px-4 py-4 text-right font-bold">{formatMoney(track.revenueCents)}</td>
												<td className="px-4 py-4">
													{track.deletedAt ? (
														<span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
															Deleted
														</span>
													) : track.isPublished ? (
														<span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
															Published
														</span>
													) : (
														<span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
															Unpublished
														</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</section>
			</section>
		</main>
	);
}