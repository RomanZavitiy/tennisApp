import { z } from "zod";

// The sign-in form and the server action share this schema: the form checks
// it before sending anything, the action checks it again because a request
// can skip the form entirely.

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .pipe(z.email("Enter a valid email address.")),
});

export type LoginValues = z.input<typeof loginSchema>;

// What the server action receives: the form values plus where to return after
// sign-in. `next` is only length-checked here; safeNextPath() decides whether
// it's a path on this site.
export const magicLinkRequestSchema = loginSchema.extend({
  next: z.string().max(2048),
});
