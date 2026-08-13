import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { subscribeProgress } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const script = await db.query.scripts.findFirst({
        where: eq(schema.scripts.id, id),
      });
      if (!script) {
        send("error", { message: "script not found" });
        controller.close();
        return;
      }

      send("hello", {
        status: script.generationStatus,
        total: script.totalScenes,
        ready: script.readyScenes,
      });
      if (
        script.generationStatus === "ready" ||
        script.generationStatus === "partial_failure"
      ) {
        send("done", { status: script.generationStatus });
        controller.close();
        return;
      }

      const unsubscribe = subscribeProgress(`script:${id}`, ({ event, data }) => {
        send(event, data);
        if (event === "done") {
          unsubscribe();
          controller.close();
        }
      });

      req.signal.addEventListener("abort", () => {
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
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
