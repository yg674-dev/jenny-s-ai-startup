import { promises as fs } from "node:fs";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const script = await db.query.scripts.findFirst({
    where: eq(schema.scripts.id, id),
  });
  if (!script) return NextResponse.json({ error: "not found" }, { status: 404 });

  const nodes = await db
    .select()
    .from(schema.nodes)
    .where(eq(schema.nodes.scriptId, id))
    .orderBy(asc(schema.nodes.createdAt));

  return NextResponse.json({ script, nodes });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(schema.scripts).where(eq(schema.scripts.id, id));
  const dir = path.join(process.cwd(), "public", "generated", id);
  await fs.rm(dir, { recursive: true, force: true });
  return NextResponse.json({ ok: true });
}
