import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import BuyPointsClient from "@/app/components/BuyPointsClient";

export default async function BuyPointsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	return <BuyPointsClient currentPoints={user.points ?? 0} />;
}