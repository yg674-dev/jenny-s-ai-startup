"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

export function LocaleToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const next: Locale = locale === "zh" ? "en" : "zh";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.replace(pathname, { locale: next })}
    >
      {locale === "zh" ? "EN" : "中"}
    </Button>
  );
}
