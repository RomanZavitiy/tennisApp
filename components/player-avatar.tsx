import Image from "next/image";
import { useTranslations } from "next-intl";

import { avatarUrl } from "@/lib/profile/avatar";
import { cn } from "@/lib/utils";

// Initials get a colour picked from the name (UI refresh), so the same
// player always looks the same and a list of them isn't a wall of grey.
const INITIAL_TONES = [
  "bg-emerald-500/15 text-emerald-800",
  "bg-sky-500/15 text-sky-800",
  "bg-violet-500/15 text-violet-800",
  "bg-orange-500/15 text-orange-800",
  "bg-rose-500/15 text-rose-800",
  "bg-teal-500/15 text-teal-800",
] as const;

function initialTone(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return INITIAL_TONES[hash % INITIAL_TONES.length];
}

// A player's photo, or the first letter of their name when there is none.
// `unoptimized`: photos are already capped at 5 MB and served by Supabase's
// CDN, and skipping Next's image optimizer means no remote-domain config.
export function PlayerAvatar({
  name,
  avatarPath,
  size = 96,
}: {
  name: string;
  avatarPath: string | null;
  size?: number;
}) {
  const t = useTranslations("PlayerAvatar");

  if (avatarPath) {
    return (
      <Image
        src={avatarUrl(avatarPath)}
        alt={t("photoAlt", { name })}
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-black/5 ring-inset",
        initialTone(name),
      )}
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
