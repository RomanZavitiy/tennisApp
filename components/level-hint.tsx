import { useTranslations } from "next-intl";

import type { LevelSignal } from "@/lib/generated/prisma/enums";

/**
 * The private level-signal hint (task W.3, owner decision 2026-11-07):
 * shown only to the player themselves, never on the public /players/[id]
 * page, and never says who gave the signal or how many -- just the hint.
 */
export function LevelHint({ hint }: { hint: LevelSignal | null }) {
  const t = useTranslations("LevelHint");

  if (!hint) {
    return null;
  }
  return <p className="text-sm text-muted-foreground">{t(hint)}</p>;
}
