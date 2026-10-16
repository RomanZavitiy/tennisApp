import { useTranslations } from "next-intl";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";

export function SiteFooter() {
  const t = useTranslations("SiteFooter");

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground">
        <span>{t("tagline")}</span>
        <nav className="flex items-center gap-4">
          <Link href="/terms" className="hover:underline">
            {t("terms")}
          </Link>
          <Link href="/privacy" className="hover:underline">
            {t("privacy")}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </footer>
  );
}
