import { getTranslations, setRequestLocale } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { LocaleToggle } from "@/components/locale-toggle";
import { ScriptList } from "@/components/script-list";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-14">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-primary/80">
            AI · Interactive Drama
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("home.heading")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("home.subheading")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <Link href="/scripts/new" className={buttonVariants({ size: "lg" })}>
            {t("nav.newScript")}
          </Link>
        </div>
      </header>

      <ScriptList emptyLabel={t("home.empty")} />
    </main>
  );
}
