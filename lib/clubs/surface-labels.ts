import type { Surface } from "@/lib/generated/prisma/enums";

// How court surfaces read on club pages (2.8) and in the offer form (3.5).
// No database import here: client components use it too.
export const SURFACE_LABELS: Record<Surface, string> = {
  CLAY: "Clay",
  ARTIFICIAL_CLAY: "Artificial clay",
  HARD: "Hard",
  ARTIFICIAL_GRASS: "Artificial grass",
  CARPET: "Carpet",
  GRASS: "Grass",
};
