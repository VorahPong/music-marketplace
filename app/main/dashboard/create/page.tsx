import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreatePageClient from "./CreatePageClient";

export default async function CreatePage() {
	const user = await getCurrentUser();

	if (!user) {

		redirect("/auth/login");
	}
	if (user.role !== "SELLER") {
		redirect("/main");
	}

	return <CreatePageClient />;
}
