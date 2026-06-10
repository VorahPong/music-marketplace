// app/api/purchases/[purchasesId]/receipt/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type ReceiptRouteContext = {
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
		hour: "numeric",
		minute: "2-digit",
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

function formatVersion(version: string) {
	return version === "FULL" ? "Full ZIP" : "Regular WAV";
}

function buildReceiptHtml({
	receiptNumber,
	purchaseId,
	buyerName,
	buyerEmail,
	sellerName,
	sellerEmail,
	trackTitle,
	trackType,
	version,
	amountPaid,
	purchaseDate,
	paypalOrderId,
	paypalCaptureId,
}: {
	receiptNumber: string;
	purchaseId: string;
	buyerName: string;
	buyerEmail: string;
	sellerName: string;
	sellerEmail: string;
	trackTitle: string;
	trackType: string;
	version: string;
	amountPaid: string;
	purchaseDate: string;
	paypalOrderId: string;
	paypalCaptureId: string;
}) {
	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Receipt ${escapeHtml(receiptNumber)}</title>
	<style>
		body {
			font-family: Arial, sans-serif;
			background: #FAF8ED;
			color: #4E3523;
			margin: 0;
			padding: 40px 20px;
		}
		.receipt {
			max-width: 860px;
			margin: 0 auto;
			background: #ffffff;
			border: 1px solid #D6CFC7;
			border-radius: 24px;
			padding: 40px;
			box-shadow: 0 20px 50px rgba(78, 53, 35, 0.08);
		}
		.header {
			display: flex;
			justify-content: space-between;
			gap: 24px;
			align-items: flex-start;
			border-bottom: 1px solid #D6CFC7;
			padding-bottom: 24px;
		}
		h1 {
			font-size: 36px;
			margin: 0 0 8px;
		}
		.subtitle {
			color: rgba(78, 53, 35, 0.72);
			margin: 0;
		}
		.badge {
			background: #FAF8ED;
			border-radius: 999px;
			padding: 10px 16px;
			font-size: 13px;
			font-weight: 700;
			white-space: nowrap;
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
		table {
			width: 100%;
			border-collapse: collapse;
			margin-top: 28px;
			border: 1px solid #D6CFC7;
			border-radius: 16px;
			overflow: hidden;
		}
		th, td {
			padding: 16px;
			text-align: left;
			border-bottom: 1px solid #D6CFC7;
		}
		th {
			background: #FAF8ED;
			font-size: 12px;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			color: rgba(78, 53, 35, 0.6);
		}
		.total-row td {
			border-bottom: none;
			font-size: 18px;
			font-weight: 800;
		}
		.right {
			text-align: right;
		}
		.notice {
			margin-top: 28px;
			border-left: 4px solid #4E3523;
			background: #FAF8ED;
			padding: 16px;
			border-radius: 12px;
			font-size: 14px;
			line-height: 1.6;
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
			.receipt {
				box-shadow: none;
				border: none;
			}
		}
		@media (max-width: 700px) {
			.receipt {
				padding: 24px;
			}
			.header {
				flex-direction: column;
			}
			.grid {
				grid-template-columns: 1fr;
			}
			.right {
				text-align: left;
			}
		}
	</style>
</head>
<body>
	<main class="receipt">
		<div class="header">
			<div>
				<h1>Receipt</h1>
				<p class="subtitle">Music Marketplace purchase receipt</p>
			</div>
			<div class="badge">${escapeHtml(receiptNumber)}</div>
		</div>

		<div class="grid">
			<div class="card">
				<div class="label">Purchase Date</div>
				<div class="value">${escapeHtml(purchaseDate)}</div>
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
				<p>${escapeHtml(sellerEmail)}</p>
			</div>
			<div class="card">
				<div class="label">PayPal Order ID</div>
				<div class="value">${escapeHtml(paypalOrderId || "Not recorded")}</div>
			</div>
			<div class="card">
				<div class="label">PayPal Capture ID</div>
				<div class="value">${escapeHtml(paypalCaptureId || "Not recorded")}</div>
			</div>
		</div>

		<table>
			<thead>
				<tr>
					<th>Item</th>
					<th>Type</th>
					<th>Version</th>
					<th class="right">Amount</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>${escapeHtml(trackTitle)}</td>
					<td>${escapeHtml(trackType)}</td>
					<td>${escapeHtml(version)}</td>
					<td class="right">${escapeHtml(amountPaid)}</td>
				</tr>
				<tr class="total-row">
					<td colspan="3">Total Paid</td>
					<td class="right">${escapeHtml(amountPaid)}</td>
				</tr>
			</tbody>
		</table>

		<div class="notice">
			This receipt confirms payment for the listed digital music product. The license terms are provided separately with the purchase license document.
		</div>

		<div class="footer">
			Generated by Music Marketplace. Keep this receipt for your records.
		</div>
	</main>
</body>
</html>`;
}

export async function GET(
	_req: NextRequest,
	{ params }: ReceiptRouteContext,
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

	const receiptNumber = purchase.receiptNumber ?? `RCPT-${purchase.id}`;
	const buyerName = purchase.user.name || purchase.user.handle || "Customer";
	const sellerName =
		purchase.track.owner?.name ||
		purchase.track.owner?.handle ||
		purchase.track.owner?.email ||
		"Seller";
	const sellerEmail = purchase.track.owner?.email || "";

	const html = buildReceiptHtml({
		receiptNumber,
		purchaseId: purchase.id,
		buyerName,
		buyerEmail: purchase.user.email,
		sellerName,
		sellerEmail,
		trackTitle: purchase.track.title,
		trackType: purchase.track.trackType,
		version: formatVersion(purchase.version),
		amountPaid: formatMoney(purchase.amountCents),
		purchaseDate: formatDate(purchase.createdAt),
		paypalOrderId: purchase.paypalOrderId ?? "",
		paypalCaptureId: purchase.paypalCaptureId ?? "",
	});

	return new NextResponse(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Content-Disposition": `inline; filename="${receiptNumber}.html"`,
		},
	});
}