import { NextResponse } from "next/server";
import type { ApiError, SubmitWorkflowEngineRequest, SubmitWorkflowEngineResponse } from "@/lib/lifeos-contracts";
import { requireUser } from "@/lib/auth";
import { serverConfig } from "@/lib/server-config";

export const runtime = "nodejs";

function cleanBaseUrl(value: string): string {
  return value.replace(/\/$/, "");
}

function toNumericUserId(userId: string): number {
  const digits = userId.replace(/\D/g, "");
  const parsed = Number.parseInt(digits.slice(-9), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 1;
  return parsed;
}

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as Partial<SubmitWorkflowEngineRequest>;

    const intent = body.intent?.trim();
    if (!intent) {
      return NextResponse.json<ApiError>({ error: "Invalid intent" }, { status: 400 });
    }

    const baseUrl = cleanBaseUrl(serverConfig.workflowEngineBaseUrl);
    const upstreamUserId = toNumericUserId(user.id);

    const target = new URL(`${baseUrl}/api/workflows/submit`);
    target.searchParams.set("user_id", String(upstreamUserId));
    target.searchParams.set("intent", intent);

    const upstreamResponse = await fetch(target.toString(), {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(Math.max(1000, serverConfig.workflowEngineTimeoutMs)),
    });

    const raw = (await upstreamResponse.json().catch(() => null)) as Record<string, unknown> | null;

    if (!upstreamResponse.ok) {
      return NextResponse.json<ApiError>(
        { error: `Workflow engine submit failed (${upstreamResponse.status})` },
        { status: 502 }
      );
    }

    const workflowId = typeof raw?.workflow_id === "number" ? raw.workflow_id : 0;
    const status = typeof raw?.status === "string" ? raw.status : "submitted";

    return NextResponse.json<SubmitWorkflowEngineResponse>({
      ok: true,
      workflowId,
      status,
      intent,
      upstreamUserId,
      checkedAt: new Date().toISOString(),
      upstream: raw,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 502;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
