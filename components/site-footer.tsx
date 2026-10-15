import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";

// Regulamin and privacy policy links join here in task 6.11.
export function SiteFooter() {
  const t = useTranslations("SiteFooter");

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground">
        <span>{t("tagline")}</span>
        <LanguageSwitcher />
      </div>
    </footer>
  );
}
