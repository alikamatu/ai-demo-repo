import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import type { ApiError, PushTestResponse } from "@/lib/lifeos-contracts";
import { listUserPushTokens } from "@/lib/push-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    const tokens = await listUserPushTokens(user.id);

    if (!tokens.length) {
      return NextResponse.json<PushTestResponse>({ ok: true, sent: 0 });
    }

    // Expo push testing endpoint. Production systems should use a queue + retries.
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        tokens.map((token) => ({
          to: token,
          sound: "default",
          title: "LifeOS",
          body: "You have pending approvals waiting.",
          data: {
            url: "/(app)/index?focus=approvals",
          },
        }))
      ),
    });

    return NextResponse.json<PushTestResponse>({
      ok: response.ok,
      sent: tokens.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
