import {
  ClockAlertIcon,
  MessagesSquareIcon,
  ShieldCheckIcon,
  TargetIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { IconTile, type IconTileTone } from "@/components/icon-tile";
import { MatchDemo } from "@/components/landing/match-demo";
import { Reveal } from "@/components/landing/motion";
import { SectionHeading } from "@/components/landing/sections";

// "Why SpinBuddy" (landing page): what a plain sparring board doesn't give
// you — a partner at your level, people who turn up, no last-minute
// cancelling, a chat to change plans in — next to a looping sample match.
// Every claim here is a rule the app enforces (lib/rating/reliability.ts,
// the feed's rating-distance sort), not a slogan.

const POINTS: { key: string; icon: ReactNode; tone: IconTileTone }[] = [
  { key: "level", icon: <TargetIcon />, tone: "green" },
  { key: "punctual", icon: <ShieldCheckIcon />, tone: "ball" },
  { key: "lastMinute", icon: <ClockAlertIcon />, tone: "orange" },
  { key: "chat", icon: <MessagesSquareIcon />, tone: "blue" },
];

export function WhySpinBuddy() {
  const t = useTranslations("LandingPage.why");

  return (
    <section className="container-page py-16 sm:py-24">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <MatchDemo
            labels={{
              initials: t("demo.initials"),
              offerTime: t("demo.offerTime"),
              offerMeta: t("demo.offerMeta"),
              reliability: t("demo.reliability"),
              ask: t("demo.ask"),
              sent: t("demo.sent"),
              accepted: t("demo.accepted"),
              rain: t("demo.rain"),
              indoor: t("demo.indoor"),
              deal: t("demo.deal"),
              booked: t("demo.booked"),
            }}
          />
        </Reveal>
        <ul className="grid gap-7">
          {POINTS.map((point, index) => (
            <li key={point.key}>
              <Reveal delay={index * 0.08} className="flex gap-4">
                <IconTile
                  tone={point.tone}
                  className="size-11 rounded-xl [&_svg]:size-5"
                >
                  {point.icon}
                </IconTile>
                <div>
                  <h3 className="text-lg font-semibold">
                    {t(`${point.key}.title`)}
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    {t(`${point.key}.text`)}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
