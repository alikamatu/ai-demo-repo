import { NextResponse } from "next/server";
import type { ApiError, MeResponse } from "@/lib/lifeos-contracts";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    return NextResponse.json<MeResponse>({ user });
  } catch {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }
}
