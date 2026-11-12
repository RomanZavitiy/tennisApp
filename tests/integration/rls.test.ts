import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { expectDbRejection, PG } from "@/tests/integration/helpers/db-errors";
import {
  createBookableClub,
  createJoin,
  createOffer,
  createPlayer,
  hoursFromNow,
} from "@/tests/integration/helpers/fixtures";
import { asApiRole, type ApiCaller } from "@/tests/integration/helpers/roles";

// Row level security, as the browser meets it (decision 1.2: deny by
// default; a handful of SELECT policies for Realtime). The roles and
// auth.uid() come from prisma/bootstrap/supabase-shim.sql, with Supabase's
// own table grants -- so what refuses a query here is RLS, not a missing
// GRANT.

async function publicTables(): Promise<string[]> {
  const rows = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  return rows.map((row) => row.tablename);
}

// `table` always comes from pg_tables above, never from outside the test.
async function countRows(
  client: Prisma.TransactionClient,
  table: string,
): Promise<number> {
  const rows = await client.$queryRawUnsafe<{ n: number }[]>(
    `SELECT count(*)::int AS n FROM "${table}"`,
  );
  return rows[0]?.n ?? 0;
}

describe("deny by default", () => {
  let tables: string[] = [];

  beforeAll(async () => {
    // Something to hide: rows in the tables a visitor would go for first.
    const author = await createPlayer();
    const player = await createPlayer();
    const offer = await createOffer(author.id);
    const join = await createJoin(offer.id, player.id);
    await db.message.create({
      data: { senderId: player.id, content: "hello", offerJoinId: join.id },
    });
    await createBookableClub();
    tables = await publicTables();
  });

  it("has RLS switched on for every table in public, the migration history included", async () => {
    const unprotected = await db.$queryRaw<{ relname: string }[]>`
      SELECT c.relname FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity`;
    expect(unprotected).toEqual([]);
    expect(tables).toContain("_prisma_migrations");
    expect(tables.length).toBeGreaterThan(25);
  });

  it("has no policy for anon, and none that writes for anyone", async () => {
    const policies = await db.$queryRaw<
      { tablename: string; cmd: string; roles: string[] }[]
    >`SELECT tablename, cmd, roles::text[] AS roles FROM pg_policies WHERE schemaname = 'public'`;
    expect(policies.length).toBeGreaterThan(0);
    for (const policy of policies) {
      expect(policy, policy.tablename).toMatchObject({
        cmd: "SELECT",
        roles: ["authenticated"],
      });
    }
  });

  it("shows anon zero rows in every table", async () => {
    // The owner sees rows in these, so "zero" below means hidden, not empty.
    for (const table of ["users", "sparring_offers", "messages", "clubs"]) {
      expect(await countRows(db, table), table).toBeGreaterThan(0);
    }
    for (const table of tables) {
      const visible = await asApiRole({ role: "anon" }, (tx) =>
        countRows(tx, table),
      );
      expect(visible, table).toBe(0);
    }
  });

  it.each(["anon", "authenticated"] as const)(
    "refuses an INSERT from %s into every table",
    async (role) => {
      const who: ApiCaller =
        role === "anon" ? { role } : { role, sub: (await createPlayer()).id };
      for (const table of tables) {
        // RLS is checked before NOT NULL and the other constraints, so an
        // empty row is enough to meet it.
        await expectDbRejection(
          asApiRole(who, (tx) =>
            tx.$executeRawUnsafe(`INSERT INTO "${table}" DEFAULT VALUES`),
          ),
          { code: PG.insufficientPrivilege, mentions: table },
        );
      }
    },
  );

  it.each(["anon", "authenticated"] as const)(
    "lets %s update or delete nothing",
    async (role) => {
      const victim = await createPlayer();
      const who: ApiCaller =
        role === "anon" ? { role } : { role, sub: victim.id };
      for (const table of tables) {
        const deleted = await asApiRole(who, (tx) =>
          tx.$executeRawUnsafe(`DELETE FROM "${table}"`),
        );
        expect(deleted, table).toBe(0);
      }
      // Not even their own row.
      const updated = await asApiRole(
        who,
        (tx) =>
          tx.$executeRaw`UPDATE users SET name = 'Hacked' WHERE id = ${victim.id}::uuid`,
      );
      expect(updated).toBe(0);
      expect(
        await db.user.findUniqueOrThrow({ where: { id: victim.id } }),
      ).toMatchObject({ name: "Test Player" });
    },
  );
});

describe("messages: thread participants can read", () => {
  function visibleMessages(sub: string, where: Prisma.MessageWhereInput) {
    return asApiRole({ role: "authenticated", sub }, (tx) =>
      tx.message.findMany({ where, select: { content: true } }),
    );
  }

  it("shows a private thread to its two participants and to nobody else", async () => {
    const author = await createPlayer();
    const player = await createPlayer();
    const stranger = await createPlayer();
    const offer = await createOffer(author.id);
    const join = await createJoin(offer.id, player.id);
    // Another request on the same offer: its player is no part of this thread.
    const rival = await createPlayer();
    await createJoin(offer.id, rival.id);
    await db.message.create({
      data: {
        senderId: player.id,
        content: "Friday at 6?",
        offerJoinId: join.id,
      },
    });
    const thread = { offerJoinId: join.id };
    const expected = [{ content: "Friday at 6?" }];

    expect(await visibleMessages(player.id, thread)).toEqual(expected);
    expect(await visibleMessages(author.id, thread)).toEqual(expected);
    expect(await visibleMessages(stranger.id, thread)).toEqual([]);
    expect(await visibleMessages(rival.id, thread)).toEqual([]);
    // A signed-in session whose id is no user at all.
    expect(await visibleMessages(randomUUID(), thread)).toEqual([]);
    expect(
      await asApiRole({ role: "anon" }, (tx) =>
        tx.message.findMany({ where: thread }),
      ),
    ).toEqual([]);
  });

  it("shows a doubles group thread to the author and accepted players only", async () => {
    const author = await createPlayer();
    const accepted = await createPlayer();
    const requested = await createPlayer();
    const offer = await createOffer(author.id, { format: "DOUBLES" });
    await createJoin(offer.id, accepted.id, { status: "ACCEPTED" });
    await createJoin(offer.id, requested.id);
    await db.message.create({
      data: { senderId: author.id, content: "Court 3", offerId: offer.id },
    });
    const thread = { offerId: offer.id };

    expect(await visibleMessages(author.id, thread)).toHaveLength(1);
    expect(await visibleMessages(accepted.id, thread)).toHaveLength(1);
    expect(await visibleMessages(requested.id, thread)).toEqual([]);
  });

  it("shows a club's chat to its followers only", async () => {
    const { club } = await createBookableClub();
    const follower = await createPlayer();
    const passerBy = await createPlayer();
    await db.clubFollow.create({
      data: { clubId: club.id, userId: follower.id },
    });
    await db.message.create({
      data: {
        senderId: follower.id,
        content: "Anyone tonight?",
        clubId: club.id,
      },
    });
    const thread = { clubId: club.id };

    expect(await visibleMessages(follower.id, thread)).toHaveLength(1);
    expect(await visibleMessages(passerBy.id, thread)).toEqual([]);
  });

  it("doesn't let a participant write to their own thread directly", async () => {
    const author = await createPlayer();
    const player = await createPlayer();
    const offer = await createOffer(author.id);
    const join = await createJoin(offer.id, player.id);

    await expectDbRejection(
      asApiRole({ role: "authenticated", sub: player.id }, (tx) =>
        tx.message.create({
          data: { senderId: player.id, content: "hi", offerJoinId: join.id },
        }),
      ),
      { code: PG.insufficientPrivilege, mentions: "messages" },
    );
  });

  it("keeps the membership function out of reach of anon", async () => {
    await expectDbRejection(
      asApiRole(
        { role: "anon" },
        (tx) =>
          tx.$queryRaw`SELECT private.is_message_thread_participant(null, null, null, null)`,
      ),
      { code: PG.insufficientPrivilege },
    );
  });
});

describe("bookings and court_blocks policies", () => {
  it("shows a booking to its player and the club's staff, a block to staff only", async () => {
    const { club, court } = await createBookableClub();
    const player = await createPlayer();
    const staff = await createPlayer();
    const stranger = await createPlayer();
    await db.clubStaff.create({ data: { clubId: club.id, userId: staff.id } });
    const slot = { startsAt: hoursFromNow(48), endsAt: hoursFromNow(49) };
    await db.booking.create({
      data: { courtId: court.id, userId: player.id, ...slot },
    });
    await db.courtBlock.create({
      data: { courtId: court.id, createdById: staff.id, ...slot },
    });
    const visible = (sub: string) =>
      asApiRole({ role: "authenticated", sub }, async (tx) => ({
        bookings: await tx.booking.count({ where: { courtId: court.id } }),
        blocks: await tx.courtBlock.count({ where: { courtId: court.id } }),
      }));

    expect(await visible(player.id)).toEqual({ bookings: 1, blocks: 0 });
    expect(await visible(staff.id)).toEqual({ bookings: 1, blocks: 1 });
    expect(await visible(stranger.id)).toEqual({ bookings: 0, blocks: 0 });
  });
});
