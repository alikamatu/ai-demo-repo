import { NextResponse } from "next/server";
import { readSnapshot } from "@/lib/lifeos-db";
import { checkLlmHealth } from "@/lib/llm/provider-health";

export const runtime = "nodejs";

export async function GET() {
  try {
    await readSnapshot("readiness_probe");
    const llm = await checkLlmHealth();
    const ready = llm.ready;
    const status = ready ? 200 : 503;

    return NextResponse.json(
      {
        ok: ready,
        ready,
        checks: {
          db: { ready: true, reason: "ok" },
          llm,
        },
        time: new Date().toISOString(),
      },
      { status }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json({ ok: false, ready: false, error: message }, { status: 503 });
  }
}
