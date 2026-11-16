"use client";

import { CheckIcon, HomeIcon, ShieldCheckIcon } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// The "Why SpinBuddy" section's moving picture: one sample match from the
// request to the court, played in a loop — ask to join, get accepted, the
// chat opens, rain is on the way, the game moves indoors. Sample content,
// hidden from assistive tech; the section's text says the same thing.

export type MatchDemoLabels = {
  initials: string;
  offerTime: string;
  offerMeta: string;
  reliability: string;
  ask: string;
  sent: string;
  accepted: string;
  rain: string;
  indoor: string;
  deal: string;
  booked: string;
};

// When each step starts, in ms from the top of the loop. The last entry is
// the pause on the finished picture before it starts over.
const STEP_AT = [0, 1400, 2600, 3900, 5500, 7100, 8400, 12500] as const;
const LAST_STEP = STEP_AT.length - 2;

const STEP = {
  sent: 1,
  accepted: 2,
  rain: 3,
  indoor: 4,
  deal: 5,
  booked: 6,
} as const;

/** The current step: the finished picture until the demo scrolls into view
 * (and always, for visitors who ask for reduced motion), then the loop. */
function useDemoStep(active: boolean): number {
  const [step, setStep] = useState(LAST_STEP);

  useEffect(() => {
    if (!active) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const play = () => {
      timers = STEP_AT.map((at, index) =>
        setTimeout(() => {
          if (index > LAST_STEP) play();
          else setStep(index);
        }, at),
      );
    };
    play();
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [active]);

  return step;
}

/** Keeps its place in the layout while hidden, so nothing below it jumps. */
function Appear({
  shown,
  className,
  children,
}: {
  shown: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={false}
      animate={
        shown
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 10, scale: 0.96 }
      }
      transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

function Bubble({
  shown,
  mine = false,
  children,
}: {
  shown: boolean;
  mine?: boolean;
  children: ReactNode;
}) {
  return (
    <Appear
      shown={shown}
      className={cn("flex", mine ? "justify-end" : "justify-start")}
    >
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
          mine
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground",
        )}
      >
        {children}
      </p>
    </Appear>
  );
}

export function MatchDemo({ labels }: { labels: MatchDemoLabels }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const step = useDemoStep(inView && !reduceMotion);

  const accepted = step >= STEP.accepted;
  const action = accepted
    ? labels.accepted
    : step >= STEP.sent
      ? labels.sent
      : labels.ask;

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative mx-auto w-full max-w-md rounded-[2rem] bg-brand p-4 shadow-md sm:p-6"
    >
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(28rem_18rem_at_100%_0%,color-mix(in_oklch,var(--highlight)_45%,transparent),transparent_70%)]" />
      <div className="surface relative p-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
            {labels.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{labels.offerTime}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {labels.offerMeta}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
              <ShieldCheckIcon className="size-3" />
              {labels.reliability}
            </p>
          </div>
        </div>
        <motion.div
          key={action}
          initial={reduceMotion ? false : { scale: 0.94, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "mt-3 flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-semibold transition-colors",
            accepted
              ? "bg-highlight text-highlight-foreground"
              : step >= STEP.sent
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary text-primary-foreground",
          )}
        >
          {accepted && <CheckIcon className="size-4" />}
          <span className="truncate">{action}</span>
        </motion.div>
      </div>

      <div className="surface relative mt-3 flex flex-col gap-2 p-4">
        <Bubble shown={step >= STEP.rain}>{labels.rain}</Bubble>
        <Bubble shown={step >= STEP.indoor} mine>
          {labels.indoor}
        </Bubble>
        <Bubble shown={step >= STEP.deal}>{labels.deal}</Bubble>
        <Appear
          shown={step >= STEP.booked}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-highlight/50 px-3 py-1.5 text-xs font-semibold text-highlight-foreground dark:bg-highlight/15 dark:text-highlight"
        >
          <HomeIcon className="size-3.5 shrink-0" />
          <span className="truncate">{labels.booked}</span>
        </Appear>
      </div>
    </div>
  );
}
