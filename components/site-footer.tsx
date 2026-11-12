import { useTranslations } from "next-intl";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { SiteLogo } from "@/components/site-logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { visibleLinks } from "@/lib/features";

export function SiteFooter() {
  const t = useTranslations("SiteFooter");
  const tHeader = useTranslations("SiteHeader");
  const tMetadata = useTranslations("Metadata");

  const columns = [
    {
      title: t("play"),
      links: visibleLinks([
        { href: "/offers", label: tHeader("sparring") },
        { href: "/clubs", label: tHeader("courts") },
        { href: "/leaderboard", label: tHeader("leaderboard") },
        { href: "/coaches", label: tHeader("coaches") },
      ]),
    },
    {
      title: t("more"),
      links: [
        { href: "/install", label: t("installApp") },
        { href: "/clubs/suggest", label: t("suggestClub") },
        { href: "/terms", label: t("terms") },
        { href: "/privacy", label: t("privacy") },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t bg-card">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <div>
          <SiteLogo alt="" className="h-9" />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            {t("tagline")}
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="eyebrow">{column.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-muted-foreground">
          <span>
            {t("copyright", {
              year: new Date().getFullYear(),
              siteName: tMetadata("siteName"),
            })}
          </span>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
