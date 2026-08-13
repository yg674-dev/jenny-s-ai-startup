"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";

type Progress = {
  status: "pending" | "generating" | "ready" | "partial_failure";
  total: number;
  ready: number;
  failed: number;
};

const STAGES = [
  "AI 正在起草开局...",
  "AI 正在展开分支...",
  "AI 正在打磨结局...",
  "分镜生成中...",
];

export function GeneratingProgress({
  scriptId,
  title,
}: {
  scriptId: string;
  title: string;
}) {
  const router = useRouter();
  const [prog, setProg] = useState<Progress>({
    status: "pending",
    total: 0,
    ready: 0,
    failed: 0,
  });

  useEffect(() => {
    const source = new EventSource(
      `/api/scripts/${encodeURIComponent(scriptId)}/progress`,
    );

    const applyUpdate = (data: Partial<Progress>) => {
      setProg((p) => ({ ...p, ...data }));
    };

    source.addEventListener("hello", (e) => {
      applyUpdate(JSON.parse((e as MessageEvent).data));
    });
    source.addEventListener("started", (e) => {
      const { total } = JSON.parse((e as MessageEvent).data);
      applyUpdate({ status: "generating", total });
    });
    source.addEventListener("progress", (e) => {
      applyUpdate(JSON.parse((e as MessageEvent).data));
    });
    source.addEventListener("done", (e) => {
      const { status } = JSON.parse((e as MessageEvent).data);
      applyUpdate({ status });
      source.close();
      setTimeout(() => router.replace(`/scripts/${scriptId}`), 800);
    });
    source.addEventListener("error", () => {});

    return () => source.close();
  }, [scriptId, router]);

  const pct =
    prog.total > 0 ? Math.round((prog.ready / prog.total) * 100) : 0;
  const stageIdx = Math.min(
    Math.floor((prog.ready / Math.max(prog.total, 1)) * STAGES.length),
    STAGES.length - 1,
  );
  const isDone = prog.status === "ready" || prog.status === "partial_failure";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-10 px-6 py-14 text-center">
      <div className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary/70">
          建档中
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          AI 正在为你预先生成一整棵剧情树，玩的时候每一步都是 0 延迟。
        </p>
      </div>

      <div className="relative flex h-40 w-40 items-center justify-center">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 289} 289`}
            className="transition-[stroke-dasharray] duration-500"
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="font-mono text-3xl font-semibold text-primary">
            {prog.ready}
            <span className="text-lg text-muted-foreground">
              /{prog.total || "?"}
            </span>
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            {pct}%
          </span>
        </div>
      </div>

      <p className="min-h-6 font-serif text-base text-foreground/80">
        {isDone
          ? prog.status === "ready"
            ? "全部就绪，正在带你进入..."
            : `完成 ${prog.ready}/${prog.total}（${prog.failed} 幕失败，仍可进入）`
          : STAGES[stageIdx]}
      </p>

      {isDone && (
        <Button
          size="lg"
          onClick={() => router.replace(`/scripts/${scriptId}`)}
        >
          进入
        </Button>
      )}
    </main>
  );
}
