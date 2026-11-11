import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactNode } from "react";

import { PageShell } from "@/components/page-shell";
import { requireAdmin } from "@/lib/auth/require-admin";

// A minimal admin area (task 6.2): no analytics dashboard here, just the
// safety queue — that's session 10 (PostHog)'s job, not this slice's.
// requireAdmin() 404s a non-admin; every page and server action under
// /admin calls it again itself (see require-admin.ts for why).
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  const t = await getTranslations("AdminLayout");

  return (
    <PageShell width="prose">
      <h1 className="text-xl font-semibold">{t("admin")}</h1>
      <nav className="mt-4 flex gap-4 text-sm">
        <Link href="/admin/reports" className="underline">
          {t("reports")}
        </Link>
        <Link href="/admin/results" className="underline">
          {t("disputedResults")}
        </Link>
        <Link href="/admin/club-submissions" className="underline">
          {t("clubSubmissions")}
        </Link>
      </nav>
      <div className="mt-6">{children}</div>
    </PageShell>
  );
}
