-- Club fields (task 2.1). Additive only: new enums and columns, nothing
-- dropped or renamed. Required columns can be NOT NULL without a default
-- because no environment has club rows yet — clubs arrive with task 2.3.

-- CreateEnum
CREATE TYPE "surface" AS ENUM ('CLAY', 'HARD', 'ARTIFICIAL_GRASS', 'CARPET', 'GRASS');

-- CreateEnum
CREATE TYPE "indoor_courts" AS ENUM ('NONE', 'YEAR_ROUND', 'WINTER_BUBBLE');

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "address" VARCHAR(200) NOT NULL,
ADD COLUMN     "booking_url" VARCHAR(500),
ADD COLUMN     "court_count" INTEGER NOT NULL,
ADD COLUMN     "district" "district" NOT NULL,
ADD COLUMN     "indoor" "indoor_courts" NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "name" VARCHAR(100) NOT NULL,
ADD COLUMN     "phone" VARCHAR(30),
ADD COLUMN     "price_info" VARCHAR(300),
ADD COLUMN     "slug" VARCHAR(60) NOT NULL,
ADD COLUMN     "surfaces" "surface"[],
ADD COLUMN     "verified_at" DATE NOT NULL,
ADD COLUMN     "website_url" VARCHAR(500);

-- CreateIndex
CREATE UNIQUE INDEX "clubs_slug_key" ON "clubs"("slug");

-- Hand-written checks, which Prisma's schema can't express. The club schema
-- (task 2.3) validates the data file first, with tighter rules (coordinates
-- inside Kraków); these keep bad data out even if a write skips that path.

-- Slug: lowercase words joined by single hyphens, e.g. "kks-nadwislan".
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_slug_format_check"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Name and address aren't just spaces.
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_name_not_blank_check"
  CHECK (btrim("name") <> '');
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_address_not_blank_check"
  CHECK (btrim("address") <> '');

-- Coordinates are real ones on Earth.
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_coordinates_check"
  CHECK ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180);

-- A club has at least one court.
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_court_count_check"
  CHECK ("court_count" > 0);

-- At least one surface and no empty entries. Prisma maps a list to a
-- nullable array column, so the "required" part lives here too.
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_surfaces_check"
  CHECK ("surfaces" IS NOT NULL
         AND cardinality("surfaces") > 0
         AND array_position("surfaces", NULL) IS NULL);

-- Links are web addresses, never "javascript:" or similar: the pages put
-- them straight into href.
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_website_url_check"
  CHECK ("website_url" ~ '^https?://');
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_booking_url_check"
  CHECK ("booking_url" ~ '^https?://');
