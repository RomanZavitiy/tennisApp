import { createSupabaseServerClient } from "@/lib/supabase/server";

// Every server action that reads or changes a user's data starts with
// `const user = await requireUser();`. The proxy guards pages only — a server
// action is a separate POST endpoint anyone can call directly, so it has to
// check the session itself (see the RLS decision for task 1.2).

export class AuthRequiredError extends Error {
  constructor() {
    super("You must be signed in to do this.");
    this.name = "AuthRequiredError";
  }
}

export type SessionUser = {
  /** Same value as auth.users.id and our User.id. */
  id: string;
  email: string | undefined;
};

export async function requireUser(): Promise<SessionUser> {
  const supabase = await createSupabaseServerClient();
  // getClaims() verifies the token's signature; getSession() would trust
  // whatever the cookie says.
  const { data } = await supabase.auth.getClaims();

  if (!data) {
    throw new AuthRequiredError();
  }

  return { id: data.claims.sub, email: data.claims.email };
}
