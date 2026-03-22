"use client";

import Link from "next/link";
import { Heart, ListMusic, Users, X } from "lucide-react";

type SidebarProps = {
	isOpen: boolean;
	onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
	return (
		<>
			{isOpen && (
				<div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
			)}

			<aside
				className={`fixed top-0 left-0 z-50 h-full w-64 transform bg-[#4E3523] text-[#FAF8ED] shadow-xl transition-transform duration-300 ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between border-b border-[#FAF8ED]/20 px-5 py-4">
					<h2 className="text-lg font-semibold">Music Market</h2>
					<button onClick={onClose} className="hover:opacity-80">
						<X size={22} />
					</button>
				</div>

				<nav className="flex flex-col gap-2 p-4">
					<Link
						href="/dashboard/following"
						className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-[#FAF8ED]/10"
						onClick={onClose}
					>
						<Users size={18} />
						<span>Following</span>
					</Link>

					<Link
						href="/dashboard/playlists"
						className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-[#FAF8ED]/10"
						onClick={onClose}
					>
						<ListMusic size={18} />
						<span>Playlists</span>
					</Link>

					<Link
						href="/main/playlist/liked"
						className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-[#FAF8ED]/10"
						onClick={onClose}
					>
						<Heart size={18} />
						<span>Liked Music</span>
					</Link>
				</nav>
			</aside>
		</>
	);
}
