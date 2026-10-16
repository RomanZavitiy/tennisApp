import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { scrubEvent } from "@/lib/monitoring/scrub-event";

describe("scrubEvent", () => {
  it("removes the user and request cookies/auth header", () => {
    const event = {
      user: { id: "u1", email: "player@example.com" },
      request: {
        url: "https://example.com/offers/1",
        cookies: { sb_session: "token" },
        headers: { cookie: "sb_session=token", authorization: "Bearer x" },
      },
    } as unknown as ErrorEvent;

    const scrubbed = scrubEvent(event);

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request?.cookies).toBeUndefined();
    expect(scrubbed.request?.headers).toEqual({});
  });

  it("does nothing when there is no request on the event", () => {
    const event = {} as ErrorEvent;

    expect(() => scrubEvent(event)).not.toThrow();
  });
});
