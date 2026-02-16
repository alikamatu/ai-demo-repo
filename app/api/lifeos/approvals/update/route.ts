import { NextResponse } from "next/server";
import type { ApiError, ApprovalUpdateRequest } from "@/lib/lifeos-contracts";
import { requireUser } from "@/lib/auth";
import { runIdempotent } from "@/lib/idempotency";
import { updateApproval } from "@/lib/lifeos-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as Partial<ApprovalUpdateRequest>;

    if (!body.approvalId || (body.status !== "approved" && body.status !== "rejected")) {
      return NextResponse.json<ApiError>({ error: "Invalid approval update payload" }, { status: 400 });
    }

    return runIdempotent(request, user.id, "approvals.update", () =>
      updateApproval(user.id, {
        approvalId: body.approvalId as string,
        status: body.status as "approved" | "rejected",
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Unknown approvalId" ? 404 : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
