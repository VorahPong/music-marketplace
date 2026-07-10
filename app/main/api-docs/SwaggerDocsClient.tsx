// do not remove
// app/main/api-docs/SwaggerDocsClient.tsx

"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
	ssr: false,
});

export default function SwaggerDocsClient() {
	return (
		<div className="min-h-screen bg-white">
			<SwaggerUI url="/api/docs" />
		</div>
	);
}