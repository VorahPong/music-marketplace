// do not remove
// lib/swagger.ts

import swaggerJSDoc from "swagger-jsdoc";

export function getOpenApiSpec() {
	return swaggerJSDoc({
		definition: {
			openapi: "3.0.0",
			info: {
				title: "OxaMic Music Marketplace API",
				version: "1.0.0",
				description:
					"API documentation for the OxaMic Music Marketplace built with Next.js, Prisma, PostgreSQL, Cloudflare R2, and PayPal.",
			},
			servers: [
				{
					url: "https://oxamicmusic.com",
					description: "Production",
				},
				{
					url: "http://localhost:3000",
					description: "Local development",
				},
			],
			tags: [
				{ name: "Auth" },
				{ name: "Tracks" },
				{ name: "Storage" },
				{ name: "Payments" },
				{ name: "Downloads" },
			],
			components: {
				securitySchemes: {
					sessionCookie: {
						type: "apiKey",
						in: "cookie",
						name: "session",
					},
				},
				schemas: {
					ErrorResponse: {
						type: "object",
						properties: {
							error: {
								type: "string",
								example: "Something went wrong.",
							},
						},
					},
					MessageResponse: {
						type: "object",
						properties: {
							message: {
								type: "string",
								example: "Success.",
							},
						},
					},
					TrackType: {
						type: "string",
						enum: ["SONG", "BEAT", "LOOP", "DRUMKIT"],
					},
					PurchaseVersion: {
						type: "string",
						enum: ["REGULAR", "FULL"],
					},
					UploadKind: {
						type: "string",
						enum: ["preview", "regular", "full"],
					},
				},
			},
		},
		apis: [
			"./app/api/**/*.ts",
			"./app/api/**/**/*.ts",
			"./app/api/**/**/**/*.ts",
		],
	});
}
