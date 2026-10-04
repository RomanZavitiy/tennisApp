"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { saveAvatar } from "@/app/(member)/profile/actions";
import { Button } from "@/components/ui/button";
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  isAvatarType,
  newAvatarPath,
} from "@/lib/profile/avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// Pick a photo → check it here → preview → save. The browser uploads straight
// to Storage (Vercel functions cap request bodies at 4.5 MB, below our 5 MB
// limit), then saveAvatar records the path and deletes the previous photo.
// The checks repeat the bucket's own limits so the player sees a clear
// message instead of a Storage error.

const ACCEPT = Object.keys(AVATAR_TYPES).join(",");

export function AvatarUpload({ userId }: { userId: string }) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Object URLs hold the file in memory until revoked.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function reset() {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function choose(picked: File | undefined) {
    setError(null);
    if (!picked) return;

    if (!isAvatarType(picked.type)) {
      reset();
      setError("Choose a JPEG, PNG or WebP image.");
      return;
    }
    if (picked.size > AVATAR_MAX_BYTES) {
      reset();
      setError("The photo is over 5 MB. Choose a smaller one.");
      return;
    }

    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  async function save() {
    if (!file || !isAvatarType(file.type)) return;
    setSaving(true);
    setError(null);

    const path = newAvatarPath(userId, file.type);
    const storage = createSupabaseBrowserClient().storage.from(AVATAR_BUCKET);
    const upload = await storage.upload(path, file, { contentType: file.type });

    const result = upload.error
      ? { ok: false as const, message: "Couldn't upload the photo. Try again." }
      : await saveAvatar(path);

    if (result.ok) {
      reset();
      router.refresh();
    } else {
      // Don't leave an uploaded file nobody points to.
      if (!upload.error) await storage.remove([path]);
      setError(result.message);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="flex items-center gap-4">
          <Image
            src={preview}
            alt="New photo preview"
            width={96}
            height={96}
            unoptimized
            className="size-24 rounded-full object-cover"
          />
          <div className="flex gap-2">
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save photo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={reset}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <label
            htmlFor={inputId}
            className="cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Change photo
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(event) => {
              choose(event.target.files?.[0]);
            }}
          />
          <p className="mt-1 text-sm text-muted-foreground">
            JPEG, PNG or WebP, up to 5 MB.
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
