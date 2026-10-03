import { z } from "zod";

import { safeNextPath } from "@/lib/auth/routes";

// /auth/callback is reached two ways (see the sign-in decision for task 1.1):
// - Google OAuth returns with `code`, exchanged for a session (PKCE);
// - the magic link email carries `token_hash` and `type`, verified as an OTP,
//   which works even when the link is opened in another browser.
// Anything else — including Supabase's own `error` parameters — is invalid.

const otpTypeSchema = z.enum(["email", "magiclink", "signup"]);

export type CallbackParams =
  | { kind: "code"; code: string; next: string }
  | {
      kind: "otp";
      tokenHash: string;
      type: z.infer<typeof otpTypeSchema>;
      next: string;
    }
  | { kind: "invalid"; next: string };

export function parseCallbackParams(params: URLSearchParams): CallbackParams {
  const next = safeNextPath(params.get("next"));

  if (params.has("error")) {
    return { kind: "invalid", next };
  }

  const code = params.get("code");
  if (code) {
    return { kind: "code", code, next };
  }

  const tokenHash = params.get("token_hash");
  const type = otpTypeSchema.safeParse(params.get("type"));
  if (tokenHash && type.success) {
    return { kind: "otp", tokenHash, type: type.data, next };
  }

  return { kind: "invalid", next };
}
