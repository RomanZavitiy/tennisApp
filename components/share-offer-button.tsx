"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const COPIED_LABEL_MS = 2000;

// "Share" on an offer's page (task Q.3): the native share sheet where the
// browser has one (navigator.share — most mobile browsers), copy-to-clipboard
// everywhere else. No new library — both are plain browser APIs.
export function ShareOfferButton({ title }: { title: string }) {
  const t = useTranslations("ShareOfferButton");
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // The user closed the share sheet without picking anything.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, COPIED_LABEL_MS);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        void share();
      }}
    >
      <Share2 className="size-4" />
      {copied ? t("linkCopied") : t("share")}
    </Button>
  );
}
