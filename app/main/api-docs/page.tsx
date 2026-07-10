// do not remove
// app/main/api-docs/page.tsx

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SwaggerDocsClient from "./SwaggerDocsClient";

export default async function ApiDocsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect("/main");
	}

	return <SwaggerDocsClient />;
}