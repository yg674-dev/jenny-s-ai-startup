import { getTranslations, setRequestLocale } from "next-intl/server";
import { NewScriptForm } from "@/components/new-script-form";
import { Link } from "@/lib/i18n/navigation";

export default async function NewScriptPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("editor");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-14">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="w-fit text-xs uppercase tracking-widest text-muted-foreground transition hover:text-primary"
        >
          ← 返回
        </Link>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          填完以下 4 项，AI 会先为你生成主角建档 + 开局第一幕。
        </p>
      </header>
      <NewScriptForm
        labels={{
          scriptTitle: t("scriptTitleLabel"),
          scriptTitlePlaceholder: t("scriptTitlePlaceholder"),
          character: t("characterLabel"),
          characterPlaceholder: t("characterPlaceholder"),
          world: t("worldLabel"),
          worldPlaceholder: t("worldPlaceholder"),
          style: t("styleLabel"),
          stylePlaceholder: t("stylePlaceholder"),
          submit: t("submit"),
          generating: t("generating"),
        }}
      />
    </main>
  );
}
