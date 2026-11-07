import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";

import { ExternalLink } from "@/components/external-link";
import type { CoachListing } from "@/lib/coaches/get-coaches";
import { DISTRICT_LABELS } from "@/lib/profile/options";

// One coach in the directory (task P.9): name, bio, levels, languages,
// price info, the clubs they teach at (linked to /clubs/[id]), "checked
// <date>", and phone/website. `id` is the coach's slug, so the "coaches at
// this club" list (task P.11) can deep-link here with /coaches#slug.
export function CoachCard({ coach }: { coach: CoachListing }) {
  const t = useTranslations("CoachCard");
  const tLevel = useTranslations("CoachLevel");
  const tLocale = useTranslations("Locale");
  const format = useFormatter();

  return (
    <article
      id={coach.slug}
      className="rounded-xl border bg-card p-4 shadow-sm"
    >
      <h2 className="font-semibold">{coach.name}</h2>
      {coach.district && (
        <p className="text-sm text-muted-foreground">
          {DISTRICT_LABELS[coach.district]}
        </p>
      )}

      {coach.bio && <p className="mt-2 whitespace-pre-line">{coach.bio}</p>}

      <p className="mt-2 text-sm text-muted-foreground">
        {coach.levels.map((level) => tLevel(level)).join(", ")}
        {" · "}
        {coach.languages.map((language) => tLocale(language)).join(", ")}
      </p>

      {coach.clubs.length > 0 && (
        <p className="mt-2 text-sm">
          {t("teachesAt")}{" "}
          {coach.clubs.map((club, index) => (
            <span key={club.id}>
              {index > 0 && ", "}
              <Link
                href={`/clubs/${club.id}`}
                className="underline-offset-4 hover:underline"
              >
                {club.name}
              </Link>
            </span>
          ))}
        </p>
      )}

      {coach.priceInfo && (
        <p className="mt-2 whitespace-pre-line text-sm">{coach.priceInfo}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        {coach.phone && (
          <a
            href={`tel:${coach.phone.replaceAll(" ", "")}`}
            className="underline-offset-4 hover:underline"
          >
            {coach.phone}
          </a>
        )}
        {coach.websiteUrl && (
          <ExternalLink
            href={coach.websiteUrl}
            className="break-all underline-offset-4 hover:underline"
          >
            {new URL(coach.websiteUrl).hostname}
          </ExternalLink>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {t("checkedOn", {
          date: format.dateTime(coach.verifiedAt, {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }),
        })}
      </p>
    </article>
  );
}
