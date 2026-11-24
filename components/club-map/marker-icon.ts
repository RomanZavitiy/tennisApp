import { icon, type Icon } from "leaflet";

import type { MarkerKind } from "./marker-kind";

// Leaflet's default icon finds its images through a path in leaflet.css,
// which breaks once a bundler moves the CSS — markers then fail to render.
// So every marker gets this explicit icon instead of patching Leaflet's global
// L.Icon.Default. The pin is the brand's own (redesign): a forest drop with
// the ball in it and a lime outline, so it reads on both the light map and
// the darkened one. Still an image icon, not a divIcon — the marker keeps
// its `alt`, which is how a screen reader (and the e2e spec) finds a club.
// Slice PD5 (PD5.2): a navy drop with a paddle for a padel club, and a
// half-and-half drop for a club with both sports (./marker-kind.ts).
function pin(iconUrl: string): Icon {
  return icon({
    iconUrl,
    iconSize: [32, 42],
    iconAnchor: [16, 41],
    popupAnchor: [0, -36],
    tooltipAnchor: [16, -28],
  });
}

export const markerIcons: Record<MarkerKind, Icon> = {
  tennis: pin("/leaflet/marker-pin.svg"),
  padel: pin("/leaflet/marker-pin-padel.svg"),
  both: pin("/leaflet/marker-pin-both.svg"),
};
