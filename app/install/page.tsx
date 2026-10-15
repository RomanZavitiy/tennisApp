import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("InstallPage");
  return { title: t("title") };
}

// Public (task 5.14): shown before sign-in too, since the iOS push hint
// (5.15, "Install the app to get notifications") links here for someone who
// hasn't signed in yet either. iOS only gets web push inside an installed
// PWA (Safari, 16.4+) — Android/Chrome gets push either way, so installing
// there is a convenience, not a requirement, and the copy says so.
export default async function InstallPage() {
  const t = await getTranslations("InstallPage");
  const iosSteps = t.raw("iosSteps") as string[];
  const androidSteps = t.raw("androidSteps") as string[];

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("intro")}</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("iosHeading")}</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
          {iosSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-2 text-sm text-muted-foreground">{t("iosRequires")}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("androidHeading")}</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
          {androidSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("androidBanner")}
        </p>
      </section>
    </main>
  );
}
