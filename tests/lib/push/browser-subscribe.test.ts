import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { urlBase64ToUint8Array } from "@/lib/push/browser-subscribe";

describe("urlBase64ToUint8Array", () => {
  // atob isn't global in the "node" test environment (decision 0.15) —
  // stub the one browser global this pure conversion needs, nothing else.
  beforeEach(() => {
    vi.stubGlobal("atob", (value: string) =>
      Buffer.from(value, "base64").toString("binary"),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("decodes a plain base64url string with no padding needed", () => {
    // "test" -> base64 "dGVzdA==" -> base64url "dGVzdA" (len % 4 == 0).
    expect(Array.from(urlBase64ToUint8Array("dGVzdA"))).toEqual([
      116, 101, 115, 116,
    ]);
  });

  it("restores the padding a base64url VAPID key has stripped", () => {
    // "test1" -> base64 "dGVzdDE=" -> base64url "dGVzdDE" (needs one '=').
    expect(Array.from(urlBase64ToUint8Array("dGVzdDE"))).toEqual([
      116, 101, 115, 116, 49,
    ]);
  });

  it("maps base64url's - and _ back to + and /", () => {
    // Bytes [251, 255, 191] base64-encode to "+/+/" in standard base64 and
    // "-_-_" in base64url.
    expect(Array.from(urlBase64ToUint8Array("-_-_"))).toEqual([251, 255, 191]);
  });
});
