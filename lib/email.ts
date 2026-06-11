// lib/email.ts

import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || smtpUser;

type VerificationPurpose = "REGISTER" | "LOGIN";

type SendVerificationCodeEmailParams = {
	to: string;
	code: string;
	purpose: VerificationPurpose;
};

function getTransporter() {
	if (!smtpHost || !smtpUser || !smtpPass || !emailFrom) {
		throw new Error(
			"Missing SMTP environment variables. Check SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM.",
		);
	}

	return nodemailer.createTransport({
		host: smtpHost,
		port: smtpPort,
		secure: smtpSecure,
		auth: {
			user: smtpUser,
			pass: smtpPass,
		},
	});
}

function getEmailContent(purpose: VerificationPurpose, code: string) {
	const isRegister = purpose === "REGISTER";
	const subject = isRegister
		? "Verify your Music Marketplace account"
		: "Your Music Marketplace login code";
	const title = isRegister ? "Verify your account" : "Complete your login";
	const message = isRegister
		? "Use this code to verify your email address."
		: "Use this code to finish logging in.";

	const text = `${message}\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.`;

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #4E3523;">
			<div style="background: #FAF8ED; border-radius: 24px; padding: 28px; border: 1px solid #D6CFC7;">
				<h1 style="margin: 0 0 12px; font-size: 28px; color: #4E3523;">${title}</h1>
				<p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4E3523;">${message}</p>

				<div style="background: #ffffff; border: 1px solid #D6CFC7; border-radius: 18px; padding: 20px; text-align: center;">
					<p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(78, 53, 35, 0.6);">Verification Code</p>
					<div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #4E3523;">${code}</div>
				</div>

				<p style="margin: 20px 0 0; font-size: 13px; line-height: 1.6; color: rgba(78, 53, 35, 0.7);">
					This code expires in 10 minutes. If you did not request this, you can ignore this email.
				</p>
			</div>
		</div>
	`;

	return {
		subject,
		text,
		html,
	};
}

export async function sendVerificationCodeEmail({
	to,
	code,
	purpose,
}: SendVerificationCodeEmailParams) {
	const transporter = getTransporter();
	const content = getEmailContent(purpose, code);

	await transporter.sendMail({
		from: emailFrom,
		to,
		subject: content.subject,
		text: content.text,
		html: content.html,
	});
}