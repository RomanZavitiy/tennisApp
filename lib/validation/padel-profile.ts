import { z } from "zod";

import { PadelSide } from "@/lib/generated/prisma/enums";
import { PADEL_LEVELS } from "@/lib/sport/sport";

// The padel part of a profile (slice PD2, docs/PADEL-PLAN.md): optional as a
// whole, unlike the tennis profile — a tennis-only player never fills it in.
// One schema for /profile/padel's form and for the action that saves it; the
// database CHECK from PD1 backs up the level's range and step.

export const padelProfileSchema = z
  .object({
    /** Null — "I don't play padel". */
    padelLevel: z
      .number()
      .refine((level) => PADEL_LEVELS.includes(level))
      .nullable(),
    padelSide: z.enum(PadelSide).nullable(),
  })
  // A side without a level means nothing: clearing the level clears both,
  // whatever the request sent.
  .transform(({ padelLevel, padelSide }) => ({
    padelLevel,
    padelSide: padelLevel === null ? null : padelSide,
  }));

export type PadelProfile = z.output<typeof padelProfileSchema>;
