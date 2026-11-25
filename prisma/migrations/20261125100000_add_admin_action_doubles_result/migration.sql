-- Slice PD4 follow-up: a disputed doubles result goes to the admin queue
-- like a singles one, so an admin action can point at a doubles result.
-- Only adds: a nullable column, its index and foreign key; the "has a
-- target" CHECK is recreated to accept the new column too (it only
-- widens what is allowed, no existing row can fail it).

ALTER TABLE "admin_actions" ADD COLUMN "doubles_result_id" UUID;

CREATE INDEX "admin_actions_doubles_result_id_idx" ON "admin_actions"("doubles_result_id");

ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_doubles_result_id_fkey" FOREIGN KEY ("doubles_result_id") REFERENCES "doubles_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admin_actions" DROP CONSTRAINT "admin_actions_has_target_check";
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_has_target_check"
  CHECK ("report_id" IS NOT NULL OR "target_user_id" IS NOT NULL OR "match_result_id" IS NOT NULL OR "doubles_result_id" IS NOT NULL);
