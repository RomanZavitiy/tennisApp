import { useTranslations } from "next-intl";

import { PageShell } from "@/components/page-shell";

// What a page shows while its server render is still on the way (the
// offer feed, the club search, a profile all wait on the database). Shaped
// like the common page — a title block, then a grid of cards — so the
// layout doesn't jump much when the real content arrives.
export function PageSkeleton() {
  const t = useTranslations("Loading");

  return (
    <PageShell>
      <div role="status" aria-live="polite" className="animate-pulse">
        <span className="sr-only">{t("label")}</span>
        <div className="h-3 w-24 rounded-full bg-muted" />
        <div className="mt-4 h-10 w-2/3 max-w-md rounded-xl bg-muted" />
        <div className="mt-3 h-4 w-1/2 max-w-sm rounded-full bg-muted" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((card) => (
            <div key={card} className="surface h-40 p-5">
              <div className="h-4 w-1/2 rounded-full bg-muted" />
              <div className="mt-3 h-3 w-3/4 rounded-full bg-muted" />
              <div className="mt-2 h-3 w-2/5 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
