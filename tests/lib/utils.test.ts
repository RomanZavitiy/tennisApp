import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

// `cn` comes from the young `cn` package (a replacement for clsx +
// tailwind-merge). Every shadcn component relies on it letting a caller's
// className override the component's own classes, so check that it does.
describe("cn", () => {
  it("lets a later Tailwind class override a conflicting earlier one", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
