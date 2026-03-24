import NavigationBar from "../components/NavigationBar";
import { getCurrentUser } from "@/lib/auth";
import { PlayerProvider } from "../components/player/PlayerProvider";
import BottomPlayer from "../components/player/BottomPlayer";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getCurrentUser();

	return (
		<PlayerProvider>
			<div className="min-h-screen bg-[#FAF8ED] pb-28 text-[#4E3523]">
				<NavigationBar user={user} />
				{children}
				<BottomPlayer />
			</div>
		</PlayerProvider>
	);
}