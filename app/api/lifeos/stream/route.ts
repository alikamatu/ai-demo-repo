import { requireUser } from "@/lib/auth";
import type { StreamEvent } from "@/lib/lifeos-contracts";
import { getLivePulse } from "@/lib/live-data";

export const runtime = "nodejs";

function encodeEvent(payload: StreamEvent): string {
  return `event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: Request) {
  try {
    requireUser(request);
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendSync = () => {
        const event: StreamEvent = {
          type: "sync",
          payload: {
            updatedAt: new Date().toISOString(),
          },
        };
        controller.enqueue(encoder.encode(encodeEvent(event)));
      };

      const sendPulse = async () => {
        const livePulse = await getLivePulse(true);
        const event: StreamEvent = {
          type: "pulse",
          payload: {
            updatedAt: new Date().toISOString(),
            livePulse,
          },
        };
        controller.enqueue(encoder.encode(encodeEvent(event)));
      };

      sendSync();
      await sendPulse();

      const interval = setInterval(async () => {
        sendSync();
        await sendPulse();
      }, 30_000);

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15_000);

      setTimeout(() => {
        clearInterval(interval);
        clearInterval(keepAlive);
        controller.close();
      }, 4 * 60_000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
