import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import {
  createAdminClient,
  createSignedInClient,
  deleteTestUser,
} from "./support/supabase-admin";

// The messages table's RLS policy (task 3.15, decision 3.1): Realtime and
// any other supabase-js read go straight through it, so it is the only
// thing deciding who can read a thread. Writes always go through the server
// action (3.16), not tested here. Rows and users are cleaned up either way.

const admin = createAdminClient();

// createSignedInClient only creates the auth user; the app's own sign-in
// route normally adds the `users` row (task 1.9), which these tests bypass.
async function addUserRow(id: string) {
  const { error } = await admin.from("users").insert({ id });
  if (error) throw error;
}

async function createOffer(
  authorId: string,
  format: "SINGLES" | "DOUBLES" = "SINGLES",
) {
  const { data, error } = await admin
    .from("sparring_offers")
    .insert({
      author_id: authorId,
      starts_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      district: "PODGORZE",
      format,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) throw error;
  return data.id;
}

test("a private thread is readable by the join's player and the offer's author only", async () => {
  const author = await createSignedInClient(admin);
  const player = await createSignedInClient(admin);
  const stranger = await createSignedInClient(admin);

  try {
    await addUserRow(author.id);
    await addUserRow(player.id);
    await addUserRow(stranger.id);
    const offerId = await createOffer(author.id);
    const { data: join, error: joinError } = await admin
      .from("offer_joins")
      .insert({ offer_id: offerId, user_id: player.id, status: "REQUESTED" })
      .select("id")
      .single<{ id: string }>();
    if (joinError) throw joinError;

    const { data: message, error: messageError } = await admin
      .from("messages")
      .insert({
        sender_id: author.id,
        offer_join_id: join.id,
        content: "See you at 6?",
      })
      .select("id")
      .single<{ id: string }>();
    if (messageError) throw messageError;

    const { data: asPlayer } = await player.client
      .from("messages")
      .select("id")
      .eq("id", message.id);
    expect(asPlayer).toEqual([{ id: message.id }]);

    const { data: asAuthor } = await author.client
      .from("messages")
      .select("id")
      .eq("id", message.id);
    expect(asAuthor).toEqual([{ id: message.id }]);

    const { data: asStranger } = await stranger.client
      .from("messages")
      .select("id")
      .eq("id", message.id);
    expect(asStranger).toEqual([]);
  } finally {
    await deleteTestUser(admin, author.id);
    await deleteTestUser(admin, player.id);
    await deleteTestUser(admin, stranger.id);
  }
});

test("a doubles offer's group thread is readable by the author and accepted players, not a declined one", async () => {
  const author = await createSignedInClient(admin);
  const accepted = await createSignedInClient(admin);
  const declined = await createSignedInClient(admin);

  try {
    await addUserRow(author.id);
    await addUserRow(accepted.id);
    await addUserRow(declined.id);
    const offerId = await createOffer(author.id, "DOUBLES");
    const { error: joinsError } = await admin.from("offer_joins").insert([
      { offer_id: offerId, user_id: accepted.id, status: "ACCEPTED" },
      { offer_id: offerId, user_id: declined.id, status: "DECLINED" },
    ]);
    if (joinsError) throw joinsError;

    const { data: message, error: messageError } = await admin
      .from("messages")
      .insert({
        sender_id: author.id,
        offer_id: offerId,
        content: `Group ${randomUUID().slice(0, 8)}`,
      })
      .select("id")
      .single<{ id: string }>();
    if (messageError) throw messageError;

    const { data: asAccepted } = await accepted.client
      .from("messages")
      .select("id")
      .eq("id", message.id);
    expect(asAccepted).toEqual([{ id: message.id }]);

    const { data: asDeclined } = await declined.client
      .from("messages")
      .select("id")
      .eq("id", message.id);
    expect(asDeclined).toEqual([]);
  } finally {
    await deleteTestUser(admin, author.id);
    await deleteTestUser(admin, accepted.id);
    await deleteTestUser(admin, declined.id);
  }
});
