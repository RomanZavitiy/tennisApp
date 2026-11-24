import { db } from "@/lib/db";

// Favourite players (slice PD3, task PD3.4): a player's own private list of
// people they like playing with — "invite my favourites" on their own game,
// and a push when one of them posts a game. One-directional and silent: the
// favourite is never told. Every DB access for the feature lives here, the
// same way lib/moderation/personal-block.ts owns user_blocks.

/** How many favourites "invite my favourites" asks at once, and so how
 * many a player can keep: the list is for regular partners, not a feed. */
export const MAX_FAVORITES = 20;

export type FavoritePlayer = {
  id: string;
  name: string | null;
  avatarPath: string | null;
};

/** Whether `userId` has `favoriteId` among their favourites. */
export async function isFavorite(
  userId: string,
  favoriteId: string,
): Promise<boolean> {
  const row = await db.playerFavorite.findUnique({
    where: { userId_favoriteId: { userId, favoriteId } },
    select: { id: true },
  });
  return row !== null;
}

/** `userId`'s favourites, newest first. */
export async function getFavoritePlayers(
  userId: string,
): Promise<FavoritePlayer[]> {
  const rows = await db.playerFavorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      favorite: { select: { id: true, name: true, avatarPath: true } },
    },
  });
  return rows.map((row) => row.favorite);
}

export type AddFavoriteRefusal = "SELF" | "BLOCKED" | "TOO_MANY";

/** Why `userId` can't add `favoriteId`, or null when they can. Pure. */
export function addFavoriteRefusal({
  userId,
  favoriteId,
  blocked,
  count,
}: {
  userId: string;
  favoriteId: string;
  /** Either side has personally blocked the other (slice R). */
  blocked: boolean;
  /** How many favourites `userId` already has. */
  count: number;
}): AddFavoriteRefusal | null {
  if (userId === favoriteId) {
    return "SELF";
  }
  if (blocked) {
    return "BLOCKED";
  }
  if (count >= MAX_FAVORITES) {
    return "TOO_MANY";
  }
  return null;
}

/** How many favourites `userId` has. */
export async function countFavorites(userId: string): Promise<number> {
  return db.playerFavorite.count({ where: { userId } });
}
