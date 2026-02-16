import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { runIdempotent } from "@/lib/idempotency";
import type { ApiError, RegisterPushRequest, RegisterPushResponse } from "@/lib/lifeos-contracts";
import { upsertPushDevice } from "@/lib/push-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as Partial<RegisterPushRequest>;

    if (!body.deviceId || !body.token || !body.platform) {
      return NextResponse.json<ApiError>({ error: "Invalid push registration payload" }, { status: 400 });
    }

    if (!["ios", "android", "web"].includes(body.platform)) {
      return NextResponse.json<ApiError>({ error: "Invalid platform" }, { status: 400 });
    }

    return runIdempotent(request, user.id, "push.register", async () => {
      const updatedAt = new Date().toISOString();

      await upsertPushDevice({
        userId: user.id,
        deviceId: body.deviceId as string,
        token: body.token as string,
        platform: body.platform as "ios" | "android" | "web",
        updatedAt,
      });

      return { ok: true, updatedAt } satisfies RegisterPushResponse;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
