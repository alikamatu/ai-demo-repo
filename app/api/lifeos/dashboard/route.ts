import { NextResponse } from "next/server";
import type { ApiError } from "@/lib/lifeos-contracts";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/lifeos-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    const response = await getDashboard(user.id);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
