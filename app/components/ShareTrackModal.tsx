"use client";

import { Copy, X } from "lucide-react";

type ShareTrackModalProps = {
	isOpen: boolean;
	onClose: () => void;
	shareUrl: string;
	copyMessage: string;
	onCopyLink: () => void;
};

export default function ShareTrackModal({
	isOpen,
	onClose,
	shareUrl,
	copyMessage,
	onCopyLink,
}: ShareTrackModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
			<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
				<div className="flex items-start justify-between">
					<div>
						<h3 className="text-lg font-semibold text-[#4E3523]">
							Share Track
						</h3>
						<p className="mt-1 text-sm text-[#4E3523]/70">
							Copy this link and share it anywhere.
						</p>
					</div>

					<button
						onClick={onClose}
						className="rounded-full p-2 text-[#4E3523] hover:bg-[#4E3523]/10"
					>
						<X size={18} />
					</button>
				</div>

				<div className="mt-4 rounded-xl border border-[#D6CFC7] bg-[#FAF8ED] px-4 py-3 text-sm text-[#4E3523] break-all">
					{shareUrl}
				</div>

				{copyMessage && (
					<p className="mt-2 text-sm text-[#4E3523]/70">{copyMessage}</p>
				)}

				<div className="mt-5 flex justify-end gap-3">
					<button
						onClick={onClose}
						className="rounded-xl border border-[#D6CFC7] px-4 py-2 text-sm text-[#4E3523] hover:bg-[#FAF8ED]"
					>
						Close
					</button>

					<button
						onClick={onCopyLink}
						className="flex items-center gap-2 rounded-xl bg-[#4E3523] px-4 py-2 text-sm font-medium text-[#FAF8ED] hover:opacity-90"
					>
						<Copy size={16} />
						Copy Link
					</button>
				</div>
			</div>
		</div>
	);
}