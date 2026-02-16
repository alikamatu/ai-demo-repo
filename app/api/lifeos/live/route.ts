import { NextResponse } from "next/server";
import type { ApiError } from "@/lib/lifeos-contracts";
import { requireUser } from "@/lib/auth";
import { getLivePulse } from "@/lib/live-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    requireUser(request);
    const response = await getLivePulse(true);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "Unauthorized"
        ? 401
        : message.startsWith("LIVE_DATA_UNAVAILABLE:")
          ? 502
          : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
