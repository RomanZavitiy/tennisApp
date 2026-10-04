-- Avatars bucket in Supabase Storage and its policies (task 1.13).
--
-- Browsers upload photos straight to Storage (the RLS decision for task 1.2),
-- so these policies are the only thing deciding who may write where:
-- - anyone can read: the bucket is public, photos are served by public URL;
-- - a signed-in user can add, replace, list and delete files only in their
--   own folder, `avatars/{auth.uid()}/…`;
-- - the bucket itself refuses files over 5 MB and anything but JPEG, PNG and
--   WebP (owner's decision; no HEIC).
--
-- Guarded because Prisma's shadow database (used by `migrate dev`) has no
-- storage schema; on Supabase it always runs.

DO $$
BEGIN
  IF to_regnamespace('storage') IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('avatars', 'avatars', true, 5242880,
          ARRAY['image/jpeg', 'image/png', 'image/webp'])
  ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

  -- `(select auth.uid())` instead of `auth.uid()`: evaluated once per query,
  -- not once per row (Supabase's RLS performance advice).
  CREATE POLICY "avatars: owner can upload"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars'
                AND (storage.foldername(name))[1] = (select auth.uid())::text);

  -- Replacing a file (upsert) needs UPDATE and SELECT as well as INSERT.
  CREATE POLICY "avatars: owner can replace"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars'
           AND (storage.foldername(name))[1] = (select auth.uid())::text)
    WITH CHECK (bucket_id = 'avatars'
                AND (storage.foldername(name))[1] = (select auth.uid())::text);

  CREATE POLICY "avatars: owner can list"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'avatars'
           AND (storage.foldername(name))[1] = (select auth.uid())::text);

  -- Lets the upload component remove the old photo (task 1.14).
  CREATE POLICY "avatars: owner can delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars'
           AND (storage.foldername(name))[1] = (select auth.uid())::text);
END
$$;
