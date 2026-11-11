import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";

export function SiteFooter() {
  const t = useTranslations("SiteFooter");
  const tHeader = useTranslations("SiteHeader");
  const tMetadata = useTranslations("Metadata");

  const columns = [
    {
      title: t("play"),
      links: [
        { href: "/offers", label: tHeader("sparring") },
        { href: "/clubs", label: tHeader("courts") },
        { href: "/leaderboard", label: tHeader("leaderboard") },
        { href: "/coaches", label: tHeader("coaches") },
      ],
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
          <Image
            src="/brand/spinbuddy-logo.webp"
            alt=""
            width={1661}
            height={445}
            className="h-9 w-auto"
          />
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
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
