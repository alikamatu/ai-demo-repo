import { NextResponse } from "next/server";
import type { ApiError, RunActionRequest } from "@/lib/lifeos-contracts";
import { requireUser } from "@/lib/auth";
import { runIdempotent } from "@/lib/idempotency";
import { runAction } from "@/lib/lifeos-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as Partial<RunActionRequest>;

    if (!body.actionId || typeof body.actionId !== "string") {
      return NextResponse.json<ApiError>({ error: "Invalid actionId" }, { status: 400 });
    }

    return runIdempotent(request, user.id, "actions.run", () =>
      runAction(user.id, { actionId: body.actionId as string })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Unknown actionId"
          ? 404
          : message.startsWith("ACTION_INTEGRATION_FAILED:")
            ? 502
            : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
