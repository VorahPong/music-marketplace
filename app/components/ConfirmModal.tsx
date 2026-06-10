"use client";

import { AlertTriangle, X } from "lucide-react";

type ConfirmModalProps = {
	isOpen: boolean;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "danger" | "default";
	loading?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

export default function ConfirmModal({
	isOpen,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "default",
	loading = false,
	onConfirm,
	onCancel,
}: ConfirmModalProps) {
	if (!isOpen) return null;

	const isDanger = variant === "danger";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
			<button
				type="button"
				aria-label="Close confirmation modal"
				onClick={onCancel}
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
			/>

			<div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 text-[#4E3523] shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div
						className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
							isDanger
								? "bg-red-50 text-red-600"
								: "bg-[#FAF8ED] text-[#4E3523]"
						}`}
					>
						<AlertTriangle size={24} />
					</div>

					<button
						type="button"
						onClick={onCancel}
						disabled={loading}
						className="rounded-full p-2 text-[#4E3523]/60 hover:bg-[#FAF8ED] hover:text-[#4E3523] disabled:opacity-60"
					>
						<X size={18} />
					</button>
				</div>

				<div className="mt-5">
					<h2 className="text-xl font-bold">{title}</h2>
					<p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#4E3523]/70">
						{description}
					</p>
				</div>

				<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button
						type="button"
						onClick={onCancel}
						disabled={loading}
						className="rounded-xl border border-[#D6CFC7] px-4 py-3 text-sm font-semibold text-[#4E3523] hover:bg-[#FAF8ED] disabled:opacity-60"
					>
						{cancelText}
					</button>

					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className={`rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 ${
							isDanger
								? "bg-red-600 hover:bg-red-700"
								: "bg-[#4E3523] hover:opacity-90"
						}`}
					>
						{loading ? "Working..." : confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}
