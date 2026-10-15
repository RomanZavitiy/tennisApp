"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function UnsubscribeButton({
  action,
}: {
  action: () => Promise<{ ok: true } | { ok: false; message: string }>;
}) {
  const t = useTranslations("UnsubscribeButton");
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (state === "done") {
    return <p className="text-sm text-muted-foreground">{t("done")}</p>;
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await action();
            if (result.ok) {
              setState("done");
            } else {
              setState("error");
              setMessage(result.message);
            }
          });
        }}
      >
        {pending ? t("saving") : t("turnOff")}
      </Button>
      {state === "error" && message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
