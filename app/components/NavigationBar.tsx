"use client";

import { useState } from "react";
import { Menu, Search, Plus, Bell } from "lucide-react";
import Sidebar from "./SideBar";

export default function NavigationBar() {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	return (
		<>
			<Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

			<div className="w-full bg-[#4E3523] px-6 py-3 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<button
						className="text-[#FAF8ED]"
						onClick={() => setIsSidebarOpen(true)}
					>
						<Menu size={24} />
					</button>
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
					<button className="flex items-center gap-2 rounded-full bg-[#FAF8ED] px-4 py-2 text-sm font-medium text-[#4E3523] hover:opacity-90">
						<Plus size={16} />
						Create
					</button>

					<button className="text-[#FAF8ED]">
						<Bell size={20} />
					</button>

					<div className="h-8 w-8 overflow-hidden rounded-full bg-gray-300">
						<img
							src="https://i.pravatar.cc/100"
							alt="profile"
							className="h-full w-full object-cover"
						/>
					</div>
				</div>
			</div>
		</>
	);
}
