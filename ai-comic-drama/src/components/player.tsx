"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Node, Script } from "@/lib/db/schema";
import { Link } from "@/lib/i18n/navigation";
import { useStoryStore } from "@/lib/stores/story";
import { TypewriterText } from "@/components/typewriter-text";
import { localizeNode, localizeScript } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/config";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function Player({ scriptId }: { scriptId: string }) {
  const t = useTranslations("player");
  const locale = useLocale() as Locale;
  const { data, mutate } = useSWR<{ script: Script; nodes: Node[] }>(
    `/api/scripts/${scriptId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const hydrate = useStoryStore((s) => s.hydrate);
  const nodes = useStoryStore((s) => s.nodes);
  const currentNodeId = useStoryStore((s) => s.currentNodeId);
  const setCurrent = useStoryStore((s) => s.setCurrent);
  const patchNode = useStoryStore((s) => s.patchNode);

  const [narrativeDone, setNarrativeDone] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (data?.script) {
      // On first hydrate, jump to root instead of "latest leaf". Localize per current locale.
      const root = data.nodes.find((n) => n.parentId === null);
      hydrate(
        localizeScript(data.script, locale),
        data.nodes.map((n) => localizeNode(n, locale)),
      );
      if (root) setCurrent(root.id);
    }
  }, [data, locale, hydrate, setCurrent]);

  const currentNode = useMemo(
    () => nodes.find((n) => n.id === currentNodeId) ?? null,
    [nodes, currentNodeId],
  );
  const parentNode = useMemo(
    () =>
      currentNode?.parentId
        ? nodes.find((n) => n.id === currentNode.parentId) ?? null
        : null,
    [nodes, currentNode],
  );
  const children = useMemo(
    () =>
      currentNode
        ? nodes.filter((n) => n.parentId === currentNode.id)
        : [],
    [nodes, currentNode],
  );

  useEffect(() => {
    setNarrativeDone(false);
  }, [currentNodeId]);

  function choose(index: number) {
    if (!currentNode) return;
    const target = children.find((c) => c.chosenOptionIndex === index);
    if (!target) {
      toast.error("这条分支还没准备好");
      return;
    }
    setCurrent(target.id);
  }

  function goBack() {
    if (!parentNode) return;
    setCurrent(parentNode.id);
  }

  async function retry() {
    if (!currentNode || retrying) return;
    setRetrying(true);
    try {
      const res = await fetch("/api/generate/retry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nodeId: currentNode.id }),
      });
      if (!res.ok) throw new Error("重试失败");
      // poll for status
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const fresh = await mutate();
        const updated = fresh?.nodes.find((n) => n.id === currentNode.id);
        if (updated && updated.status !== "pending" &&
            updated.status !== "generating_text" &&
            updated.status !== "generating_image") {
          patchNode(currentNode.id, updated);
          if (updated.status === "failed") toast.error(updated.errorMessage ?? "重试失败");
          break;
        }
      }
    } finally {
      setRetrying(false);
    }
  }

  if (!data || !currentNode) return <PlayerLoading />;

  const isReady = currentNode.status === "ready";
  const isFailed = currentNode.status === "failed";
  const isLeaf = isReady && (!currentNode.options || currentNode.options.length === 0);
  const sceneDepth = computeDepth(currentNode, nodes);
  const optionsToShow = isReady ? currentNode.options ?? [] : [];
  const imageToShow = isReady ? currentNode.imageUrl : null;

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary/70">
            第 {sceneDepth} 幕
          </p>
          <h1 className="truncate font-serif text-lg font-semibold">
            {data.script.title}
          </h1>
        </div>
        <div className="flex shrink-0 gap-1">
          {parentNode && (
            <Button size="sm" variant="ghost" onClick={goBack}>
              ← 上一幕
            </Button>
          )}
          <Link
            href="/"
            className={buttonVariants({ size: "sm", variant: "ghost" })}
          >
            {t("backHome")}
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-8 px-6 pb-14 md:grid-cols-[minmax(0,7fr)_minmax(0,10fr)]">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card">
          <div className="relative aspect-[3/4] w-full">
            {imageToShow ? (
              <img
                key={imageToShow}
                src={imageToShow}
                alt=""
                className="h-full w-full object-cover animate-in fade-in duration-500"
              />
            ) : isFailed ? (
              <FailureBlock message={currentNode.errorMessage} />
            ) : isReady ? (
              <EmptyPanel />
            ) : (
              <LoadingBlock label={retrying ? "重试中..." : "载入中..."} />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="min-h-40 font-serif text-[17px] leading-[1.85] text-foreground/95">
            {isFailed ? (
              <p className="text-destructive/90">
                {currentNode.errorMessage ?? "这一幕生成失败了"}
              </p>
            ) : currentNode.narrative ? (
              <TypewriterText
                text={currentNode.narrative}
                onDone={() => setNarrativeDone(true)}
              />
            ) : (
              <TextSkeleton />
            )}
          </div>

          {isFailed ? (
            <div className="flex gap-2">
              <Button onClick={retry} disabled={retrying} className="flex-1">
                {retrying ? "重试中..." : "重试这一幕"}
              </Button>
              {parentNode && (
                <Button variant="outline" onClick={goBack}>
                  返回上一幕
                </Button>
              )}
            </div>
          ) : isLeaf ? (
            <EndingCard onHome={() => window.location.assign("/zh")} />
          ) : optionsToShow.length > 0 ? (
            <div
              className={`flex flex-col gap-2 transition duration-500 ${
                narrativeDone ? "opacity-100" : "opacity-40 pointer-events-none"
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {t("chooseHint")}
              </p>
              <div className="flex flex-col gap-2">
                {optionsToShow.map((opt, i) => (
                  <ChoiceCard
                    key={`${currentNode.id}-opt-${i}`}
                    index={i}
                    label={opt}
                    onClick={() => choose(i)}
                  />
                ))}
              </div>
              {!narrativeDone && (
                <p className="text-[11px] text-muted-foreground">
                  点击叙述可跳过打字动画
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function computeDepth(current: Node, all: Node[]): number {
  let d = 1;
  const byId = new Map(all.map((n) => [n.id, n]));
  let cursor: string | null = current.parentId ?? null;
  while (cursor) {
    d++;
    cursor = byId.get(cursor)?.parentId ?? null;
  }
  return d;
}

function PlayerLoading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-6 py-12">
      <div className="text-sm text-muted-foreground">加载中...</div>
    </main>
  );
}

function ChoiceCard({
  index,
  label,
  onClick,
}: {
  index: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex items-center gap-4 rounded-2xl border border-border/70 bg-card px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-card/90 hover:shadow-lg hover:shadow-primary/10"
    >
      <span className="font-mono text-xs text-primary/70">0{index + 1}</span>
      <span className="flex-1 font-serif text-[15px] leading-snug">{label}</span>
      <span className="text-primary/60 transition group-hover:translate-x-1 group-hover:text-primary">
        →
      </span>
    </button>
  );
}

function EndingCard({ onHome }: { onHome: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/40 bg-card p-6 text-center">
      <p className="font-serif text-lg font-semibold text-primary">
        · 剧终 ·
      </p>
      <p className="text-xs text-muted-foreground">
        这条分支已到尽头，可以返回上一幕走另一条路
      </p>
      <Button variant="outline" size="sm" onClick={onHome}>
        回到首页
      </Button>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted/40 to-card/60 p-8">
      <div className="font-serif text-6xl text-primary/40">·</div>
      <span className="font-serif text-xs uppercase tracking-widest text-muted-foreground">
        黑幕
      </span>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-sm text-muted-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <span className="font-serif text-xs uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

function FailureBlock({ message }: { message: string | null }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center text-destructive">
      <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-destructive/60 text-lg">
        !
      </div>
      <span className="max-w-xs text-xs text-destructive/80">
        {message ?? "生成失败"}
      </span>
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-[92%] animate-pulse rounded bg-muted" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
    </div>
  );
}
