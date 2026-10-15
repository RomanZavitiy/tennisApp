import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hasMeaningfulAction,
  markMeaningfulAction,
} from "@/lib/push/meaningful-action";

function fakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  };
}

describe("meaningful action flag", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is false before anything is marked", () => {
    vi.stubGlobal("localStorage", fakeLocalStorage());

    expect(hasMeaningfulAction()).toBe(false);
  });

  it("is true once marked", () => {
    vi.stubGlobal("localStorage", fakeLocalStorage());

    markMeaningfulAction();

    expect(hasMeaningfulAction()).toBe(true);
  });

  it("never throws when storage is unavailable (no global at all)", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(() => {
      markMeaningfulAction();
    }).not.toThrow();
    expect(hasMeaningfulAction()).toBe(false);
  });

  it("never throws when storage itself throws (private browsing)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });

    expect(() => {
      markMeaningfulAction();
    }).not.toThrow();
    expect(hasMeaningfulAction()).toBe(false);
  });
});
