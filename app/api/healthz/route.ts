import { NextResponse } from "next/server";
import { serverConfig } from "@/lib/server-config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "lifeos",
    llmMode: serverConfig.llmMode,
    time: new Date().toISOString(),
  });
}
