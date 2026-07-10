// do not remove
// app/api/docs/route.ts

import { getOpenApiSpec } from "@/lib/swagger";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
	const spec = getOpenApiSpec();

	return NextResponse.json(spec);
}
