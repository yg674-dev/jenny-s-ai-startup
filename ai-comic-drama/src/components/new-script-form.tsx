"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/lib/i18n/navigation";

type Labels = {
  scriptTitle: string;
  scriptTitlePlaceholder: string;
  character: string;
  characterPlaceholder: string;
  world: string;
  worldPlaceholder: string;
  style: string;
  stylePlaceholder: string;
  submit: string;
  generating: string;
};

export function NewScriptForm({ labels }: { labels: Labels }) {
  const locale = useLocale();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    character: "",
    world: "",
    style: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "创建失败");
      const { scriptId } = (await res.json()) as { scriptId: string };
      router.push(`/scripts/${scriptId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <Section
        num="01"
        title={labels.scriptTitle}
        input={
          <Input
            required
            value={form.title}
            placeholder={labels.scriptTitlePlaceholder}
            className="h-12 text-base"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        }
      />
      <Section
        num="02"
        title={labels.character}
        input={
          <Textarea
            required
            rows={4}
            value={form.character}
            placeholder={labels.characterPlaceholder}
            className="min-h-28 text-base leading-relaxed"
            onChange={(e) => setForm({ ...form, character: e.target.value })}
          />
        }
      />
      <Section
        num="03"
        title={labels.world}
        input={
          <Textarea
            required
            rows={4}
            value={form.world}
            placeholder={labels.worldPlaceholder}
            className="min-h-28 text-base leading-relaxed"
            onChange={(e) => setForm({ ...form, world: e.target.value })}
          />
        }
      />
      <Section
        num="04"
        title={labels.style}
        optional
        input={
          <Input
            value={form.style}
            placeholder={labels.stylePlaceholder}
            className="h-11"
            onChange={(e) => setForm({ ...form, style: e.target.value })}
          />
        }
      />
      <div className="mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="sm:min-w-48"
        >
          {submitting ? labels.generating : `${labels.submit} →`}
        </Button>
      </div>
    </form>
  );
}

function Section({
  num,
  title,
  input,
  optional,
}: {
  num: string;
  title: string;
  input: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-primary/70">{num}</span>
        <Label className="font-serif text-lg font-medium">{title}</Label>
        {optional && (
          <span className="text-xs text-muted-foreground">— optional</span>
        )}
      </div>
      {input}
    </div>
  );
}
