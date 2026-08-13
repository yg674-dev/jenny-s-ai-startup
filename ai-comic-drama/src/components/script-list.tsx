"use client";

import { useLocale } from "next-intl";
import useSWR from "swr";
import { Link } from "@/lib/i18n/navigation";
import type { Node, Script } from "@/lib/db/schema";
import { localizeScript } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/config";

type ListItem = { script: Script; cover: string | null; sceneCount: number };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ScriptList({ emptyLabel }: { emptyLabel: string }) {
  const locale = useLocale() as Locale;
  const { data, isLoading } = useSWR<{ scripts: Script[] }>(
    "/api/scripts",
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="aspect-[3/4] animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!data?.scripts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 p-16 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full border-2 border-primary/40 grid place-items-center text-2xl text-primary/70">
          +
        </div>
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {data.scripts.map((s) => (
        <ScriptCard key={s.id} script={localizeScript(s, locale)} />
      ))}
    </div>
  );
}

function ScriptCard({ script }: { script: Script }) {
  const { data } = useSWR<{ script: Script; nodes: Node[] }>(
    `/api/scripts/${script.id}`,
    fetcher,
    { revalidateOnFocus: false },
  );
  const cover =
    data?.nodes.find((n) => n.status === "ready" && n.imageUrl)?.imageUrl ??
    null;
  const sceneCount = data?.nodes.filter((n) => n.status === "ready").length ?? 0;

  return (
    <Link
      href={`/scripts/${script.id}`}
      className="group relative flex aspect-[3/4] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
    >
      {cover ? (
        <img
          src={cover}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-muted to-card text-4xl font-serif text-primary/40">
          {script.title.slice(0, 1)}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="relative mt-auto flex flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-serif text-base font-semibold text-white">
          {script.title}
        </h3>
        <p className="text-[11px] uppercase tracking-wider text-white/60">
          {sceneCount} 幕
        </p>
      </div>
    </Link>
  );
}
