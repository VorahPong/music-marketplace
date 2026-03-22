"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Search, Plus, Bell, LogOut, Settings, User } from "lucide-react";
import Sidebar from "./SideBar";
import Link from "next/link";

type NavigationBarProps = {
	user: {
		id: string;
		name: string | null;
		email: string;
	} | null;
};

export default function NavigationBar({ user }: NavigationBarProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);

	const profileRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				profileRef.current &&
				!profileRef.current.contains(event.target as Node)
			) {
				setIsProfileOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<>
			<Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

			<div className="relative w-full bg-[#4E3523] px-6 py-3 flex items-center justify-between">
				<div className="flex items-center gap-6">
					{/* Menu */}
					<button
						className="text-[#FAF8ED]"
						onClick={() => setIsSidebarOpen(true)}
					>
						<Menu size={22} />
					</button>

					{/* Logo */}
					<Link href="/">
						<img
							src="/icons/musicworld.png"
							alt="Music World logo"
							className="h-10 w-20 object-contain cursor-pointer"
						/>
					</Link>
				</div>

				<div className="mx-6 flex-1 max-w-xl">
					<div className="flex items-center overflow-hidden rounded-full bg-[#FAF8ED]">
						<input
							type="text"
							placeholder="Search"
							className="w-full bg-transparent px-4 py-2 text-sm text-[#4E3523] outline-none"
						/>
						<div className="px-4 text-[#4E3523]">
							<Search size={18} />
						</div>
					</div>
				</div>

				<div className="flex items-center gap-4">
					<Link href="/dashboard/create">
						<button className="flex items-center gap-2 rounded-full bg-[#FAF8ED] px-4 py-2 text-sm font-medium text-[#4E3523] hover:opacity-90">
							<Plus size={16} />
							Create
						</button>
					</Link>

					<button className="text-[#FAF8ED]">
						<Bell size={20} />
					</button>

					<div className="relative" ref={profileRef}>
						<button
							onClick={() => {
								if (!user) {
									window.location.href = "/auth/login";
									return;
								}
								setIsProfileOpen((prev) => !prev);
							}}
							className="h-8 w-8 overflow-hidden rounded-full bg-gray-300 ring-2 ring-transparent transition hover:ring-[#FAF8ED]/60 flex items-center justify-center"
						>
							{user ? (
								<img
									src={`https://i.pravatar.cc/100?u=${user.id}`}
									alt="profile"
									className="h-full w-full object-cover"
								/>
							) : (
								<span className="text-[#4E3523] text-sm font-semibold">?</span>
							)}
						</button>

						{isProfileOpen && (
							<div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#E5DED6] bg-[#FAF8ED] p-2 shadow-xl">
								<div className="border-b border-[#E5DED6] px-3 py-3">
									<p className="text-sm font-semibold text-[#4E3523]">
										Vorahpong Mean
									</p>
									<p className="text-xs text-[#4E3523]/70">@vorahpong</p>
								</div>

								<div className="mt-2 flex flex-col">
									<Link
										href={user ? `/channel/${user.id}` : "/auth/login"}
										className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
										onClick={() => setIsProfileOpen(false)}
									>
										<User size={16} />
										View Channel
									</Link>

									<Link
										href={user ? `/settings` : "/auth/login"}
										className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
										onClick={() => setIsProfileOpen(false)}
									>
										<Settings size={16} />
										Settings
									</Link>

									<button
										className="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
										onClick={async () => {
											try {
												await fetch("/api/logout", { method: "POST" });
												setIsProfileOpen(false);
												window.location.href = "/";
											} catch (error) {
												console.error("Logout failed:", error);
											}
										}}
									>
										<LogOut size={16} />
										Logout
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
