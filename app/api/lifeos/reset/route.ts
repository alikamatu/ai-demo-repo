import { NextResponse } from "next/server";
import type { ApiError } from "@/lib/lifeos-contracts";
import { requireUser } from "@/lib/auth";
import { runIdempotent } from "@/lib/idempotency";
import { resetDashboard } from "@/lib/lifeos-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    return runIdempotent(request, user.id, "dashboard.reset", () => resetDashboard(user.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
