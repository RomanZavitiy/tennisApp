import Image from "next/image";

import { avatarUrl } from "@/lib/profile/avatar";

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
  if (avatarPath) {
    return (
      <Image
        src={avatarUrl(avatarPath)}
        alt={`${name}'s photo`}
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
      className="flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground"
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
