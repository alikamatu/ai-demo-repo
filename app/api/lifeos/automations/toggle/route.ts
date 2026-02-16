import { NextResponse } from "next/server";
import type { ApiError, AutomationToggleRequest } from "@/lib/lifeos-contracts";
import { requireUser } from "@/lib/auth";
import { runIdempotent } from "@/lib/idempotency";
import { toggleAutomation } from "@/lib/lifeos-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as Partial<AutomationToggleRequest>;

    if (!body.automationId || (body.status !== "active" && body.status !== "paused")) {
      return NextResponse.json<ApiError>({ error: "Invalid automation toggle payload" }, { status: 400 });
    }

    return runIdempotent(request, user.id, "automations.toggle", () =>
      toggleAutomation(user.id, {
        automationId: body.automationId as string,
        status: body.status as "active" | "paused",
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Unknown automationId" ? 404 : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
