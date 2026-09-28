import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

// The one place a PrismaClient is created — import `db` from here.
//
// In development Next.js re-evaluates modules on every hot reload; a fresh
// client each time would open a new connection pool and soon exhaust
// Supabase's connection limit. Keeping the instance on globalThis lets it
// survive reloads. In production the module is evaluated once, so the cache
// isn't needed.

function createClient() {
  // Runtime traffic goes through the pooled (transaction-mode) connection.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
