import { NextResponse } from "next/server";
import type { ApiError, WorkflowEngineStatusResponse } from "@/lib/lifeos-contracts";
import { requireUser } from "@/lib/auth";
import { serverConfig } from "@/lib/server-config";

export const runtime = "nodejs";

function cleanBaseUrl(value: string): string {
  return value.replace(/\/$/, "");
}

export async function GET(request: Request) {
  try {
    requireUser(request);
    const baseUrl = cleanBaseUrl(serverConfig.workflowEngineBaseUrl);

    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(Math.max(1000, serverConfig.workflowEngineTimeoutMs)),
      });

      if (!response.ok) {
        return NextResponse.json<WorkflowEngineStatusResponse>({
          available: false,
          baseUrl,
          checkedAt: new Date().toISOString(),
          error: `Upstream health returned ${response.status}`,
        });
      }

      const health = (await response.json().catch(() => null)) as Record<string, unknown> | null;

      return NextResponse.json<WorkflowEngineStatusResponse>({
        available: true,
        baseUrl,
        checkedAt: new Date().toISOString(),
        health,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workflow engine unreachable";
      return NextResponse.json<WorkflowEngineStatusResponse>({
        available: false,
        baseUrl,
        checkedAt: new Date().toISOString(),
        error: message,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
