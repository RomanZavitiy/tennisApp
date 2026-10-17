import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatKrakowTimeRange } from "@/lib/offers/krakow-time";
import type { MyGame } from "@/lib/offers/my-games";
import { placeLabel } from "@/lib/offers/offer-labels";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { cn } from "@/lib/utils";

// The player's upcoming games on their own profile (slice K6), each linking
// to its offer, with where they stand: their own offer (and requests to
// answer), in, or still waiting on the author.
export function MyGames({ games }: { games: MyGame[] }) {
  const t = useTranslations("MyGames");
  const format = useFormatter();

  if (games.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        <p>{t("none")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/offers" className={buttonVariants({ size: "sm" })}>
            {t("findAGame")}
          </Link>
          <Link
            href="/offers/new"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            {t("postAnOffer")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {games.map((game) => (
        <li key={`${game.role}-${game.offerId}`}>
          <Link
            href={`/offers/${game.offerId}`}
            className="flex items-center justify-between gap-3 py-3 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0">
              <span className="block font-medium">
                {formatKrakowTimeRange(
                  format,
                  game.startsAt,
                  game.durationMinutes,
                )}
              </span>
              <span className="block text-sm text-muted-foreground">
                {placeLabel(
                  game,
                  game.district ? DISTRICT_LABELS[game.district] : null,
                )}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                game.role === "ACCEPTED"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {game.role === "AUTHOR"
                ? t("yourOffer", { count: game.pendingRequests })
                : game.role === "ACCEPTED"
                  ? t("youAreIn")
                  : t("requestSent")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
