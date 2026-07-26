"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
	Menu,
	Search,
	Plus,
	LogOut,
	Settings,
	User,
	BarChart3,
	LifeBuoy,
} from "lucide-react";
import Sidebar from "./SideBar";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// do not remove
// app/components/NavigationBar.tsx

type NavigationBarProps = {
	user: {
		id: string;
		name: string | null;
		email: string;
		handle: string;
		role: string;
	} | null;
};

function NavigationSearch() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

	function getMainHref(query: string) {
		const params = new URLSearchParams();

		if (pathname === "/main" && searchParams.get("view") === "customer") {
			params.set("view", "customer");
		}

		if (query) {
			params.set("q", query);
		}

		const queryString = params.toString();
		return queryString ? `/main?${queryString}` : "/main";
	}

	function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		router.push(getMainHref(searchValue.trim()));
	}

	function handleClearSearch() {
		setSearchValue("");
		router.push(getMainHref(""));
	}

	return (
		<form onSubmit={handleSearchSubmit} className="mx-6 max-w-xl flex-1">
			<div className="flex items-center overflow-hidden rounded-full bg-[#FAF8ED]">
				<input
					type="text"
					value={searchValue}
					onChange={(event) => setSearchValue(event.target.value)}
					placeholder="Search by title"
					className="w-full bg-transparent px-4 py-2 text-sm text-[#4E3523] outline-none"
				/>

				{pathname === "/main" && searchValue.trim() && (
					<button
						type="button"
						onClick={handleClearSearch}
						className="px-2 text-xs font-medium text-[#4E3523]/60 hover:text-[#4E3523]"
					>
						Clear
					</button>
				)}

				<button type="submit" className="px-4 text-[#4E3523]">
					<Search size={18} />
				</button>
			</div>
		</form>
	);
}

export default function NavigationBar({ user }: NavigationBarProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const searchParams = useSearchParams();

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
			<Sidebar
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
				user={user}
			/>

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
					<Link href="/main">
						<img
							src="/icons/musicworld.png"
							alt="Music World logo"
							className="h-10 w-20 object-contain cursor-pointer"
						/>
					</Link>
				</div>

				<NavigationSearch key={searchParams.toString()} />

				<div className="flex items-center gap-4">
					{(user?.role === "SELLER" || user?.role === "ADMIN") && (
						<Link href="/main/dashboard/create">
							<button className="flex items-center gap-2 rounded-full bg-[#FAF8ED] px-4 py-2 text-sm font-medium text-[#4E3523] hover:opacity-90">
								<Plus size={16} />
								Create
							</button>
						</Link>
					)}

					{/* Notification */}
					{/* <button className="text-[#FAF8ED]">
						<Bell size={20} />
					</button> */}

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
								<span className="flex h-full w-full items-center justify-center rounded-full bg-[#EAD9C7] text-sm font-bold text-[#4E3523]">
									{(
										user.name?.trim()?.charAt(0) || user.email.charAt(0)
									).toUpperCase()}
								</span>
							) : (
								<span className="flex h-full w-full items-center justify-center rounded-full bg-[#EAD9C7] text-sm font-bold text-[#4E3523]">
									?
								</span>
							)}
						</button>

						{isProfileOpen && (
							<div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#E5DED6] bg-[#FAF8ED] p-2 shadow-xl">
								<div className="border-b border-[#E5DED6] px-3 py-3">
									<p className="text-sm font-semibold text-[#4E3523]">
										{user?.name}
									</p>
									<p className="text-xs text-[#4E3523]/70">@{user?.handle}</p>
								</div>

								<div className="mt-2 flex flex-col">
									<Link
										href={user ? `/main/channel/${user.handle}` : "/auth/login"}
										className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
										onClick={() => setIsProfileOpen(false)}
									>
										<User size={16} />
										View Channel
									</Link>

									<Link
										href={user ? `/main/settings` : "/auth/login"}
										className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
										onClick={() => setIsProfileOpen(false)}
									>
										<Settings size={16} />
										Settings
									</Link>

									<Link
										href={user ? `/main/support` : "/auth/login"}
										className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
										onClick={() => setIsProfileOpen(false)}
									>
										<LifeBuoy size={16} />
										Support
									</Link>

									{user?.role === "ADMIN" && (
										<Link
											href="/main/admin"
											className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#4E3523] hover:bg-[#4E3523]/10"
											onClick={() => setIsProfileOpen(false)}
										>
											<BarChart3 size={16} />
											Admin Analytics
										</Link>
									)}

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
