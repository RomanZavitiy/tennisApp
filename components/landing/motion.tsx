"use client";

import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";

// The landing page's three animations (redesign), all on the `motion`
// library and all switched off for visitors who ask for reduced motion.

/** Fades and slides its children in the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

/** A slow vertical bob — the hero's floating cards. */
export function Float({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
      transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Counts up to `value` once it scrolls into view. The server renders the
 * final number, so it is right without JavaScript too. */
export function NumberTicker({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = String(Math.round(latest));
        }
      },
    });
    return () => {
      controls.stop();
    };
  }, [inView, reduceMotion, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}
