"use server";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import {
  exportUserData,
  type UserDataExport,
} from "@/lib/privacy/export-user-data";

// "Download my data" (task 6.14). Always the signed-in user's own id, never
// a value from the client — the one thing this action must get right.
export async function exportMyData(): Promise<UserDataExport> {
  const user = await requireOnboardedUser();
  return exportUserData(user.id);
}
