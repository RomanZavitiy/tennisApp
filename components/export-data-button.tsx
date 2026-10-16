"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { exportMyData } from "@/app/(member)/profile/export/actions";
import { Button } from "@/components/ui/button";

// Downloads the JSON a server action builds (task 6.14) — the action can
// only return data, not a file, so the browser-side part turns it into one:
// a Blob + a throwaway <a download>, the standard way to save client-made
// content without a dedicated route.
export function ExportDataButton() {
  const t = useTranslations("ExportDataPage");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function download() {
    setError(false);
    startTransition(async () => {
      try {
        const data = await exportMyData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `matchfinder-data-${data.exportedAt.slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <div>
      <Button type="button" disabled={pending} onClick={download}>
        {pending ? t("downloading") : t("downloadButton")}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{t("error")}</p>}
    </div>
  );
}
