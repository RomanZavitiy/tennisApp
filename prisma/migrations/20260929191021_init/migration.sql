-- CreateEnum
CREATE TYPE "offer_status" AS ENUM ('OPEN', 'FULL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "join_status" AS ENUM ('REQUESTED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "match_result_status" AS ENUM ('PENDING', 'CONFIRMED', 'DISPUTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sparring_offers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "offer_status" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" UUID NOT NULL,
    "club_id" UUID,

    CONSTRAINT "sparring_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_joins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "join_status" NOT NULL DEFAULT 'REQUESTED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offer_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "offer_joins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "match_result_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offer_join_id" UUID NOT NULL,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sparring_offers_author_id_idx" ON "sparring_offers"("author_id");

-- CreateIndex
CREATE INDEX "sparring_offers_club_id_idx" ON "sparring_offers"("club_id");

-- CreateIndex
CREATE INDEX "offer_joins_user_id_idx" ON "offer_joins"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_joins_offer_id_user_id_key" ON "offer_joins"("offer_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_results_offer_join_id_key" ON "match_results"("offer_join_id");

-- AddForeignKey
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_joins" ADD CONSTRAINT "offer_joins_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "sparring_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_joins" ADD CONSTRAINT "offer_joins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_offer_join_id_fkey" FOREIGN KEY ("offer_join_id") REFERENCES "offer_joins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
