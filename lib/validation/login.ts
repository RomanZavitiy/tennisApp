import { z } from "zod";

type ValidationT = (key: string) => string;

// The sign-in form and the server action share this schema: the form checks
// it before sending anything, the action checks it again because a request
// can skip the form entirely. `t` is a translator for the
// "Validation.login" namespace (task 1.20).
export function loginSchema(t: ValidationT) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t("emailRequired"))
      .pipe(z.email(t("emailInvalid"))),
  });
}

export type LoginValues = z.input<ReturnType<typeof loginSchema>>;

// What the server action receives: the form values plus where to return after
// sign-in. `next` is only length-checked here; safeNextPath() decides whether
// it's a path on this site.
export function magicLinkRequestSchema(t: ValidationT) {
  return loginSchema(t).extend({
    next: z.string().max(2048),
  });
}

// The one-time code from the same email, typed into the tab the player
// started in. Spaces are dropped ("123 456" is how people copy it). The
// length is a range, not exactly 6: Supabase's "Email OTP length" setting
// decides it, and the form shouldn't break if that setting changes.
export function loginCodeSchema(t: ValidationT) {
  return z.object({
    code: z
      .string()
      .transform((value) => value.replace(/\s/g, ""))
      .pipe(
        z
          .string()
          .min(1, t("codeRequired"))
          .regex(/^\d{6,10}$/, t("codeInvalid")),
      ),
  });
}

export type LoginCodeValues = z.input<ReturnType<typeof loginCodeSchema>>;

// What verifyLoginCode receives: who the code was sent to, the code, and
// where to go afterwards.
export function loginCodeRequestSchema(t: ValidationT) {
  return magicLinkRequestSchema(t).extend(loginCodeSchema(t).shape);
}
