import type { District, Gender } from "@/lib/generated/prisma/enums";

// What the profile form offers and how profile values are shown. Values come
// from the Prisma enums; `Record<District, string>` makes the compiler insist
// on a label for every enum value, so the schema and these lists can't drift.

/** The 18 dzielnice in their official order, I–XVIII. */
export const DISTRICT_LABELS: Record<District, string> = {
  STARE_MIASTO: "Stare Miasto",
  GRZEGORZKI: "Grzegórzki",
  PRADNIK_CZERWONY: "Prądnik Czerwony",
  PRADNIK_BIALY: "Prądnik Biały",
  KROWODRZA: "Krowodrza",
  BRONOWICE: "Bronowice",
  ZWIERZYNIEC: "Zwierzyniec",
  DEBNIKI: "Dębniki",
  LAGIEWNIKI_BOREK_FALECKI: "Łagiewniki-Borek Fałęcki",
  SWOSZOWICE: "Swoszowice",
  PODGORZE_DUCHACKIE: "Podgórze Duchackie",
  BIEZANOW_PROKOCIM: "Bieżanów-Prokocim",
  PODGORZE: "Podgórze",
  CZYZYNY: "Czyżyny",
  MISTRZEJOWICE: "Mistrzejowice",
  BIENCZYCE: "Bieńczyce",
  WZGORZA_KRZESLAWICKIE: "Wzgórza Krzesławickie",
  NOWA_HUTA: "Nowa Huta",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
};

export const NTRP_MIN = 1.5;
export const NTRP_MAX = 7;
export const NTRP_STEP = 0.5;

/** 1.5, 2.0, … 7.0 — the same scale the database CHECK enforces. */
export const NTRP_LEVELS = Array.from(
  { length: (NTRP_MAX - NTRP_MIN) / NTRP_STEP + 1 },
  (_, i) => NTRP_MIN + i * NTRP_STEP,
);
