"use client";

import { createContext, useContext } from "react";

// The club picked on /clubs, shared by the list and the map (task 2.7).
// `from` says where the click came from, so only the other side reacts:
// a click in the list moves the map, a click on a marker scrolls the list.
export type ClubSelection = { id: string; from: "list" | "map" } | null;

export type ClubSelectionContextValue = {
  selection: ClubSelection;
  select: (id: string, from: "list" | "map") => void;
  /** Clears the selection, but only if it is still this club. */
  clear: (id: string) => void;
};

export const ClubSelectionContext =
  createContext<ClubSelectionContextValue | null>(null);

/** Null outside ClubsView: the map then works on its own, without a list. */
export function useClubSelection() {
  return useContext(ClubSelectionContext);
}
