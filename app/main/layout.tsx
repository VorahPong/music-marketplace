import NavigationBar from "../components/NavigationBar";
import { getCurrentUser } from "@/lib/auth";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getCurrentUser();

	return (
		<html lang="en">
			<body className="bg-[#FAF8ED] text-[#4E3523]">
				<NavigationBar user={user} />
				{children}
			</body>
		</html>
	);
}