-- Profile photo path (task 1.14). Additive only: one nullable column.
ALTER TABLE "users" ADD COLUMN     "avatar_path" VARCHAR(200);

-- The photo must sit in the user's own Storage folder, "{id}/{file}" with no
-- further slashes. The server action checks this first; the CHECK keeps a
-- row from ever pointing at someone else's file.
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_path_own_folder_check"
  CHECK ("avatar_path" IS NULL
         OR ("avatar_path" LIKE "id"::text || '/%'
             AND length("avatar_path") > 37
             AND strpos(substr("avatar_path", 38), '/') = 0));
