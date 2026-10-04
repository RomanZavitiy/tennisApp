-- Profile fields (task 1.10). Additive only: new enums and nullable columns,
-- nothing dropped or renamed. Columns are nullable because the row exists
-- from the first sign-in, before onboarding.

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "district" AS ENUM ('STARE_MIASTO', 'GRZEGORZKI', 'PRADNIK_CZERWONY', 'PRADNIK_BIALY', 'KROWODRZA', 'BRONOWICE', 'ZWIERZYNIEC', 'DEBNIKI', 'LAGIEWNIKI_BOREK_FALECKI', 'SWOSZOWICE', 'PODGORZE_DUCHACKIE', 'BIEZANOW_PROKOCIM', 'PODGORZE', 'CZYZYNY', 'MISTRZEJOWICE', 'BIENCZYCE', 'WZGORZA_KRZESLAWICKIE', 'NOWA_HUTA');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "birth_date" DATE,
ADD COLUMN     "district" "district",
ADD COLUMN     "gender" "gender",
ADD COLUMN     "name" VARCHAR(50),
ADD COLUMN     "onboarding_completed_at" TIMESTAMPTZ,
ADD COLUMN     "self_rated_ntrp" DOUBLE PRECISION;

-- Hand-written checks, which Prisma's schema can't express. Code validates
-- with Zod first (task 1.11); these keep bad data out even if a write skips
-- that path (SQL editor, a future bug).

-- NTRP: 1.5–7.0 in steps of 0.5.
ALTER TABLE "users" ADD CONSTRAINT "users_self_rated_ntrp_check"
  CHECK ("self_rated_ntrp" BETWEEN 1.5 AND 7.0
         AND "self_rated_ntrp" * 2 = trunc("self_rated_ntrp" * 2));

-- A name, when set, isn't just spaces.
ALTER TABLE "users" ADD CONSTRAINT "users_name_not_blank_check"
  CHECK (btrim("name") <> '');

-- A user who finished onboarding has every profile field.
ALTER TABLE "users" ADD CONSTRAINT "users_onboarded_profile_complete_check"
  CHECK ("onboarding_completed_at" IS NULL
         OR ("name" IS NOT NULL AND "birth_date" IS NOT NULL
             AND "gender" IS NOT NULL AND "district" IS NOT NULL
             AND "self_rated_ntrp" IS NOT NULL));
