// do not remove
// lib/storage.ts

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;
const r2Endpoint = process.env.R2_ENDPOINT || (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : undefined);

export type StorageFolder = "previews" | "regular" | "full";

function getRequiredR2Config() {
	if (!r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName) {
		throw new Error(
			"Missing R2 storage environment variables. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and optionally R2_ENDPOINT.",
		);
	}

	return {
		endpoint: r2Endpoint,
		accessKeyId: r2AccessKeyId,
		secretAccessKey: r2SecretAccessKey,
		bucketName: r2BucketName,
	};
}

function getR2Client() {
	const config = getRequiredR2Config();

	return new S3Client({
		region: "auto",
		endpoint: config.endpoint,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
	});
}

function sanitizeFileExtension(fileName: string) {
	const extension = fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
	return extension || "";
}

export function createStorageKey(folder: StorageFolder, fileName: string) {
	const extension = sanitizeFileExtension(fileName);
	return `${folder}/${crypto.randomUUID()}${extension}`;
}

export async function uploadFileToStorage({
	key,
	file,
	contentType,
}: {
	key: string;
	file: File;
	contentType?: string;
}) {
	const config = getRequiredR2Config();
	const client = getR2Client();
	const arrayBuffer = await file.arrayBuffer();

	await client.send(
		new PutObjectCommand({
			Bucket: config.bucketName,
			Key: key,
			Body: Buffer.from(arrayBuffer),
			ContentType: contentType || file.type || "application/octet-stream",
		}),
	);

	return key;
}

export async function getFileFromStorage(key: string) {
	const config = getRequiredR2Config();
	const client = getR2Client();

	return client.send(
		new GetObjectCommand({
			Bucket: config.bucketName,
			Key: key,
		}),
	);
}

export async function getSignedFileUrl(key: string, expiresInSeconds = 60) {
	const config = getRequiredR2Config();
	const client = getR2Client();

	return getSignedUrl(
		client,
		new GetObjectCommand({
			Bucket: config.bucketName,
			Key: key,
		}),
		{ expiresIn: expiresInSeconds },
	);
}

export async function deleteFileFromStorage(key: string) {
	const config = getRequiredR2Config();
	const client = getR2Client();

	await client.send(
		new DeleteObjectCommand({
			Bucket: config.bucketName,
			Key: key,
		}),
	);
}