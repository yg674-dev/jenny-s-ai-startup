import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { buildStoryTree, newId } from "@/lib/generation";
import type { Locale } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const scripts = await db
    .select()
    .from(schema.scripts)
    .orderBy(desc(schema.scripts.createdAt));
  return NextResponse.json({ scripts });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    locale?: Locale;
    title?: string;
    character?: string;
    world?: string;
    style?: string;
  };

  const title = body.title?.trim();
  const character = body.character?.trim();
  const world = body.world?.trim();
  const locale: Locale = body.locale === "en" ? "en" : "zh";

  if (!title || !character || !world) {
    return NextResponse.json(
      { error: "title / character / world 都是必填" },
      { status: 400 },
    );
  }

  const scriptId = newId("scr");
  const rootNodeId = newId("nd");

  await db.insert(schema.scripts).values({
    id: scriptId,
    locale,
    title,
    characterSetup: character,
    worldSetup: world,
    stylePrompt: body.style?.trim() ?? "",
    rootNodeId,
    generationStatus: "pending",
  });

  await db.insert(schema.nodes).values({
    id: rootNodeId,
    scriptId,
    parentId: null,
    chosenOptionIndex: null,
    chosenOptionText: null,
    status: "pending",
    narrative: "",
  });

  buildStoryTree(scriptId, rootNodeId).catch((err) =>
    console.error("[buildStoryTree]", err),
  );

  return NextResponse.json({ scriptId, rootNodeId });
}
