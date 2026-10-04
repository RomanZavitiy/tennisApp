"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// Ends the session on this device only. Supabase's default scope is "global",
// which would also sign the user out on their phone and every other browser.
// signOut() clears the auth cookies through the server client, and the
// redirect re-renders the header without the session.
export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
