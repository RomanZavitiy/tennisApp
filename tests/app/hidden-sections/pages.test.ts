import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ClubChatPage from "@/app/clubs/[id]/chat/page";
import CoachesPage from "@/app/coaches/page";
import LeaderboardPage from "@/app/leaderboard/page";
import { features } from "@/lib/features";

// The three pages behind lib/features.ts, called the way Next calls them.
// Session and data loaders are replaced: what's under test is that a
// switched-off page answers 404 before it touches the session or the
// database, and that a switched-on one loads its data as before.
const CLUB = "44444444-4444-4444-8444-444444444444";
const ME = "11111111-1111-4111-8111-111111111111";
const NOT_FOUND = "NEXT_HTTP_ERROR_FALLBACK;404";

const {
  getLeaderboard,
  getCoaches,
  getClub,
  getClubFollowInfo,
  getClubThread,
  getCurrentUser,
  requireOnboardedUser,
} = vi.hoisted(() => ({
  getLeaderboard: vi.fn(),
  getCoaches: vi.fn(),
  getClub: vi.fn(),
  getClubFollowInfo: vi.fn(),
  getClubThread: vi.fn(),
  getCurrentUser: vi.fn(),
  requireOnboardedUser: vi.fn(),
}));

vi.mock("next/server", () => ({ connection: () => Promise.resolve() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/leaderboard/get-leaderboard", () => ({ getLeaderboard }));
vi.mock("@/lib/coaches/get-coaches", () => ({ getCoaches }));
vi.mock("@/lib/clubs/club-details", () => ({ getClub, getClubFollowInfo }));
vi.mock("@/lib/messages/thread-data", () => ({ getClubThread }));
vi.mock("@/lib/auth/require-user", () => ({ getCurrentUser }));
vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/offers/my-open-offers", () => ({ getMyOpenOffers: vi.fn() }));
// Client components that pull in server actions; never rendered here.
vi.mock("@/components/leaderboard-row", () => ({ LeaderboardRow: () => null }));
vi.mock("@/components/message-thread", () => ({ MessageThread: () => null }));
vi.mock("@/components/follow-club-button", () => ({
  FollowClubButton: () => null,
}));

const defaults = { ...features };
const noSearch = { searchParams: Promise.resolve({}) };
const clubParams = { params: Promise.resolve({ id: CLUB }) };

beforeEach(() => {
  vi.clearAllMocks();
  getLeaderboard.mockResolvedValue([]);
  getCoaches.mockResolvedValue([]);
  getClub.mockResolvedValue({ id: CLUB, name: "KKS Olsza" });
  getClubFollowInfo.mockResolvedValue({
    followerCount: 0,
    viewerFollows: false,
  });
  getClubThread.mockResolvedValue(null);
  getCurrentUser.mockResolvedValue(null);
  requireOnboardedUser.mockResolvedValue({ id: ME, blockedAt: null });
});

afterEach(() => {
  Object.assign(features, defaults);
});

describe("/leaderboard", () => {
  it("answers 404 without loading anything while switched off", async () => {
    features.leaderboard = false;

    await expect(LeaderboardPage(noSearch)).rejects.toThrow(NOT_FOUND);
    expect(getLeaderboard).not.toHaveBeenCalled();
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("renders the ranking once switched on", async () => {
    features.leaderboard = true;

    await expect(LeaderboardPage(noSearch)).resolves.toBeTruthy();
    expect(getLeaderboard).toHaveBeenCalledWith({});
  });
});

describe("/coaches", () => {
  it("answers 404 without loading anything while switched off", async () => {
    features.coaches = false;

    await expect(CoachesPage(noSearch)).rejects.toThrow(NOT_FOUND);
    expect(getCoaches).not.toHaveBeenCalled();
  });

  it("renders the directory once switched on", async () => {
    features.coaches = true;

    await expect(CoachesPage(noSearch)).resolves.toBeTruthy();
    expect(getCoaches).toHaveBeenCalledWith({});
  });
});

describe("/clubs/[id]/chat", () => {
  it("answers 404 before the session check while switched off", async () => {
    features.clubChat = false;

    await expect(ClubChatPage(clubParams)).rejects.toThrow(NOT_FOUND);
    // A guest must not be redirected to /login on the way to a 404.
    expect(requireOnboardedUser).not.toHaveBeenCalled();
    expect(getClubThread).not.toHaveBeenCalled();
  });

  it("loads the thread for the viewer once switched on", async () => {
    features.clubChat = true;

    await expect(ClubChatPage(clubParams)).resolves.toBeTruthy();
    expect(requireOnboardedUser).toHaveBeenCalled();
    expect(getClubThread).toHaveBeenCalledWith(CLUB, ME);
  });
});
