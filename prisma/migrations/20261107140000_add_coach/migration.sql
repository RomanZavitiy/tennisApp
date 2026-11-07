-- Coaching directory: Coach model + the implicit many-to-many to Club
-- (session P1, task P.2, decision 2026-11-07). Additive only (AGENTS.md §6).
-- Applied directly, same workaround as every migration since 3.15 (decision
-- 2026-10-14) -- prisma migrate dev still can't replay the history past
-- auth.uid() on a shadow database without the auth schema.

-- CreateEnum
CREATE TYPE "coach_level" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'KIDS');

-- CreateTable
CREATE TABLE "coaches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slug" VARCHAR(60) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "bio" VARCHAR(600),
    "district" "district",
    "levels" "coach_level"[],
    "languages" "locale"[],
    "price_info" VARCHAR(300),
    "phone" VARCHAR(30),
    "website_url" VARCHAR(500),
    "verified_at" DATE NOT NULL,

    CONSTRAINT "coaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable: the implicit many-to-many Prisma generates for
-- Coach.clubs <-> Club.coaches (task P.2 — "where they teach").
CREATE TABLE "_ClubToCoach" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ClubToCoach_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "coaches_slug_key" ON "coaches"("slug");

-- CreateIndex
CREATE INDEX "_ClubToCoach_B_index" ON "_ClubToCoach"("B");

-- AddForeignKey
ALTER TABLE "_ClubToCoach" ADD CONSTRAINT "_ClubToCoach_A_fkey" FOREIGN KEY ("A") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ClubToCoach" ADD CONSTRAINT "_ClubToCoach_B_fkey" FOREIGN KEY ("B") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written checks, mirroring clubs_*_check from 20261005120000_add_club_fields.
-- The coach schema (lib/validation/coach.ts) validates the data file first;
-- these keep bad data out even if a write skips that path.

-- Slug: lowercase words joined by single hyphens, e.g. "jan-kowalski".
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_slug_format_check"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Name isn't just spaces.
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_name_not_blank_check"
  CHECK (btrim("name") <> '');

-- At least one level and no empty entries -- a coach with no declared level
-- can't be found by the directory's filters (task P.9).
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_levels_check"
  CHECK ("levels" IS NOT NULL
         AND cardinality("levels") > 0
         AND array_position("levels", NULL) IS NULL);

-- At least one language and no empty entries, same reasoning as levels.
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_languages_check"
  CHECK ("languages" IS NOT NULL
         AND cardinality("languages") > 0
         AND array_position("languages", NULL) IS NULL);

-- Links are web addresses, never "javascript:" or similar: the page puts
-- them straight into href (via ExternalLink), same as clubs_website_url_check.
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_website_url_check"
  CHECK ("website_url" ~ '^https?://');

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as clubs: only the server
-- (Prisma) reads this table — coaches are owner-curated, never read or
-- written from the browser (task P.1 decision).
ALTER TABLE "coaches" ENABLE ROW LEVEL SECURITY;

-- The implicit join table is a new table too -- same rule, same no-policy
-- reasoning: it's never queried except through the server-side Coach/Club
-- relations.
ALTER TABLE "_ClubToCoach" ENABLE ROW LEVEL SECURITY;
