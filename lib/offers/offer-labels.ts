import type { useFormatter } from "next-intl";

import type { District, OfferFormat } from "@/lib/generated/prisma/enums";
import { formatKrakowTime } from "@/lib/offers/krakow-time";
import { DISTRICT_LABELS } from "@/lib/profile/options";

// How an offer's facts read on its card (3.6) and, later, its page (3.13).
// Every label here comes from a translator the caller already has
// (useTranslations/getTranslations, namespace "OfferLabels" — task 1.20);
// these functions stay pure otherwise, so the existing unit tests just pass
// a fake `t`.

export type LabelT = (
  key: string,
  values?: Record<string, number | string>,
) => string;

type Formatter = ReturnType<typeof useFormatter>;

export function formatLabel(
  t: LabelT,
  offer: { format: OfferFormat; hasPartner: boolean },
): string {
  if (offer.format === "SINGLES") {
    return t("singles");
  }
  return offer.hasPartner ? t("doublesWithPartner") : t("doubles");
}

export function spotsLabel(t: LabelT, spotsLeft: number): string {
  if (spotsLeft === 0) {
    return t("full");
  }
  return t("spotsLeft", { count: spotsLeft });
}

/** "NTRP 3.0–4.5", "NTRP 3.0+", "NTRP up to 4.5" or "Any level". */
export function levelLabel(
  t: LabelT,
  ntrpMin: number | null,
  ntrpMax: number | null,
): string {
  if (ntrpMin !== null && ntrpMax !== null) {
    return ntrpMin === ntrpMax
      ? t("levelExact", { min: ntrpMin })
      : t("levelRange", { min: ntrpMin, max: ntrpMax });
  }
  if (ntrpMin !== null) {
    return t("levelAtLeast", { min: ntrpMin });
  }
  if (ntrpMax !== null) {
    return t("levelUpTo", { max: ntrpMax });
  }
  return t("anyLevel");
}

/** "Club name, District", or whichever of the two the offer has. */
export function placeLabel(
  offer: { club: { name: string } | null; district: District | null },
  districtLabel: string | null,
): string {
  return [offer.club?.name, offer.district && districtLabel]
    .filter(Boolean)
    .join(", ");
}

/**
 * "Sparring, Tue 20 Oct, 18:00, NTRP 3.5–4.0, Podgórze" — an offer's share
 * title (task Q.3) and OG preview title (Q.4), from the same translator
 * namespace ("OfferPage") so the two always read the same.
 */
export function offerShareTitle(
  t: LabelT,
  tOfferLabels: LabelT,
  format: Formatter,
  offer: {
    startsAt: Date;
    ntrpMin: number | null;
    ntrpMax: number | null;
    club: { name: string } | null;
    district: District | null;
  },
): string {
  const time = formatKrakowTime(format, offer.startsAt);
  const level = levelLabel(tOfferLabels, offer.ntrpMin, offer.ntrpMax);
  const place = placeLabel(
    offer,
    offer.district ? DISTRICT_LABELS[offer.district] : null,
  );
  const title = t("ogTitle", { word: t("ogWord"), time, level });
  return place ? `${title}, ${place}` : title;
}
