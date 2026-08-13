import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db, schema } from "@/lib/db";
import { GeneratingProgress } from "@/components/generating-progress";
import { Player } from "@/components/player";

export const dynamic = "force-dynamic";

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const script = await db.query.scripts.findFirst({
    where: eq(schema.scripts.id, id),
  });
  if (!script) notFound();

  if (
    script.generationStatus === "pending" ||
    script.generationStatus === "generating"
  ) {
    return <GeneratingProgress scriptId={id} title={script.title} />;
  }
  return <Player scriptId={id} />;
}
