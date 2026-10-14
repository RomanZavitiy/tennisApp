import { describe, expect, it, vi } from "vitest";

import { postSystemMessage } from "@/lib/messages/post-system-message";

const { messageCreate } = vi.hoisted(() => ({ messageCreate: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { message: { create: messageCreate } } }));

describe("postSystemMessage", () => {
  it("writes a SYSTEM message with no sender into a join's thread", async () => {
    await postSystemMessage({ offerJoinId: "join-1" }, "Welcome");

    expect(messageCreate).toHaveBeenCalledWith({
      data: { type: "SYSTEM", content: "Welcome", offerJoinId: "join-1" },
    });
  });

  it("writes into a group thread by offer id", async () => {
    await postSystemMessage({ offerId: "offer-1" }, "Welcome");

    expect(messageCreate).toHaveBeenCalledWith({
      data: { type: "SYSTEM", content: "Welcome", offerId: "offer-1" },
    });
  });
});
