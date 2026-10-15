import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

// Placeholder until the real home page. The button proves shadcn/ui and the
// theme tokens in globals.css are wired up.
export default function Home() {
  const t = useTranslations("HomePage");
  const tMetadata = useTranslations("Metadata");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        {tMetadata("siteName")}
      </h1>
      <p className="max-w-md text-muted-foreground">{t("tagline")}</p>
      <Button size="lg">{t("comingSoon")}</Button>
    </main>
  );
}
