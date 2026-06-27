// app/api/purchases/[purchasesId]/license/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type LicenseRouteContext = {
	params: Promise<{
		purchasesId: string;
	}>;
};

function formatMoney(amountCents: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(amountCents / 100);
}

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function escapeHtml(value: string | null | undefined) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function getLicenseName(version: string) {
	return version === "FULL" ? "Full ZIP License" : "Regular WAV License";
}

function getLicenseSummary(version: string) {
	if (version === "FULL") {
		return "This license includes access to the full ZIP package for the purchased track. The buyer may use the track in one song, video, or creative project, including commercial release, but may not resell, redistribute, or claim ownership of the original instrumental or included files.";
	}

	return "This license includes access to the regular WAV version of the purchased track. The buyer may use the track in one song, video, or creative project, including commercial release, but may not resell, redistribute, or claim ownership of the original instrumental.";
}

function buildLicenseHtml({
	purchaseId,
	licenseNumber,
	licenseName,
	licenseSummary,
	buyerName,
	buyerEmail,
	sellerName,
	trackTitle,
	trackType,
	amountPaid,
	purchaseDate,
}: {
	purchaseId: string;
	licenseNumber: string;
	licenseName: string;
	licenseSummary: string;
	buyerName: string;
	buyerEmail: string;
	sellerName: string;
	trackTitle: string;
	trackType: string;
	amountPaid: string;
	purchaseDate: string;
}) {
	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>${escapeHtml(licenseName)} - ${escapeHtml(trackTitle)}</title>
	<style>
		body {
			font-family: Arial, sans-serif;
			background: #FAF8ED;
			color: #4E3523;
			margin: 0;
			padding: 40px 20px;
		}
		.document {
			max-width: 860px;
			margin: 0 auto;
			background: #ffffff;
			border: 1px solid #D6CFC7;
			border-radius: 24px;
			padding: 40px;
			box-shadow: 0 20px 50px rgba(78, 53, 35, 0.08);
		}
		h1 {
			font-size: 32px;
			margin: 0 0 8px;
		}
		.subtitle {
			color: rgba(78, 53, 35, 0.72);
			margin: 0 0 32px;
		}
		.grid {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 16px;
			margin: 28px 0;
		}
		.card {
			background: #FAF8ED;
			border-radius: 16px;
			padding: 16px;
		}
		.label {
			font-size: 12px;
			font-weight: 700;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: rgba(78, 53, 35, 0.58);
			margin-bottom: 8px;
		}
		.value {
			font-size: 16px;
			font-weight: 700;
			word-break: break-word;
		}
		section {
			margin-top: 32px;
		}
		h2 {
			font-size: 20px;
			margin: 0 0 12px;
		}
		p, li {
			line-height: 1.7;
			font-size: 14px;
		}
		ul {
			padding-left: 20px;
		}
		.notice {
			border-left: 4px solid #4E3523;
			background: #FAF8ED;
			padding: 16px;
			border-radius: 12px;
		}
		.footer {
			margin-top: 40px;
			padding-top: 24px;
			border-top: 1px solid #D6CFC7;
			font-size: 12px;
			color: rgba(78, 53, 35, 0.62);
		}
		@media print {
			body {
				background: white;
				padding: 0;
			}
			.document {
				box-shadow: none;
				border: none;
			}
		}
		@media (max-width: 700px) {
			.document {
				padding: 24px;
			}
			.grid {
				grid-template-columns: 1fr;
			}
		}
	</style>
</head>
<body>
	<main class="document">
		<h1>${escapeHtml(licenseName)}</h1>
		<p class="subtitle">License document for ${escapeHtml(trackTitle)}</p>

		<div class="grid">
			<div class="card">
				<div class="label">License Number</div>
				<div class="value">${escapeHtml(licenseNumber)}</div>
			</div>
			<div class="card">
				<div class="label">Purchase ID</div>
				<div class="value">${escapeHtml(purchaseId)}</div>
			</div>
			<div class="card">
				<div class="label">Buyer</div>
				<div class="value">${escapeHtml(buyerName)}</div>
				<p>${escapeHtml(buyerEmail)}</p>
			</div>
			<div class="card">
				<div class="label">Seller</div>
				<div class="value">${escapeHtml(sellerName)}</div>
			</div>
			<div class="card">
				<div class="label">Track</div>
				<div class="value">${escapeHtml(trackTitle)}</div>
				<p>${escapeHtml(trackType)}</p>
			</div>
			<div class="card">
				<div class="label">Amount Paid</div>
				<div class="value">${escapeHtml(amountPaid)}</div>
				<p>${escapeHtml(purchaseDate)}</p>
			</div>
		</div>

		<section>
			<h2>License Grant</h2>
			<p>${escapeHtml(licenseSummary)}</p>
		</section>

		<section>
			<h2>Allowed Usage</h2>
			<ul>
				<li>Use the purchased track in one recorded song, video, podcast, livestream, or creative project.</li>
				<li>Release the finished project on streaming platforms and social media.</li>
				<li>Monetize the finished project, unless a separate written agreement says otherwise.</li>
				<li>Credit the producer/seller when reasonable.</li>
			</ul>
		</section>

		<section>
			<h2>Restrictions</h2>
			<ul>
				<li>The buyer may not resell, lease, sublicense, redistribute, or give away the original track files.</li>
				<li>The buyer may not claim ownership of the original instrumental, beat, loop, drum kit, stems, or project files.</li>
				<li>The buyer may not upload the original files to content ID systems in a way that blocks the seller or other licensed users.</li>
				<li>This license is not exclusive unless a separate written exclusive agreement is signed by the seller.</li>
			</ul>
		</section>

		<section class="notice">
			<strong>Important:</strong> This document is a generated OXAMIC's marketplace license based on the purchase record. For high-value releases or exclusive rights, both parties should use a separate written agreement.
		</section>

		<div class="footer">
			Generated by OXAMIC Music World Marketplace. This license is tied to the purchase record shown above.
		</div>
	</main>
</body>
</html>`;
}

export async function GET(
	_req: NextRequest,
	{ params }: LicenseRouteContext,
) {
	const user = await getCurrentUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { purchasesId } = await params;

	const purchase = await prisma.trackPurchase.findUnique({
		where: {
			id: purchasesId,
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
				include: {
					owner: {
						select: {
							id: true,
							name: true,
							handle: true,
							email: true,
						},
					},
				},
			},
		},
	});

	if (!purchase) {
		return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
	}

	const isBuyer = purchase.userId === user.id;
	const isSeller = purchase.track.ownerId === user.id;

	if (!isBuyer && !isSeller) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const licenseNumber = purchase.receiptNumber
		? `LIC-${purchase.receiptNumber}`
		: `LIC-${purchase.id}`;
	const licenseName = getLicenseName(purchase.version);
	const licenseSummary = getLicenseSummary(purchase.version);
	const buyerName = purchase.user.name || purchase.user.handle || "Customer";
	const sellerName =
		purchase.track.owner?.name ||
		purchase.track.owner?.handle ||
		purchase.track.owner?.email ||
		"Seller";

	const html = buildLicenseHtml({
		purchaseId: purchase.id,
		licenseNumber,
		licenseName,
		licenseSummary,
		buyerName,
		buyerEmail: purchase.user.email,
		sellerName,
		trackTitle: purchase.track.title,
		trackType: purchase.track.trackType,
		amountPaid: formatMoney(purchase.amountCents),
		purchaseDate: formatDate(purchase.createdAt),
	});

	return new NextResponse(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Content-Disposition": `inline; filename="${licenseNumber}.html"`,
		},
	});
}