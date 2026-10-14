-- Court status (task 3.22): whether the court for an offer is already
-- booked. Additive only — a new enum and a column with a default, nothing
-- dropped or renamed.

-- CreateEnum
CREATE TYPE "court_status" AS ENUM ('BOOKED', 'WILL_BOOK', 'ANY');

-- AlterTable
ALTER TABLE "sparring_offers" ADD COLUMN "court_status" "court_status" NOT NULL DEFAULT 'WILL_BOOK';
