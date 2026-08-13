import { NextResponse } from "next/server";
import { retryScene } from "@/lib/generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { nodeId } = (await req.json()) as { nodeId?: string };
  if (!nodeId) {
    return NextResponse.json({ error: "nodeId 必填" }, { status: 400 });
  }
  retryScene(nodeId).catch((err) => console.error("[retryScene]", err));
  return NextResponse.json({ ok: true });
}
