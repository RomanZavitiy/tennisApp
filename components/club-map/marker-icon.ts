import { icon } from "leaflet";

// Leaflet's default icon finds its images through a path in leaflet.css,
// which breaks once a bundler moves the CSS — markers then fail to render.
// So every marker gets this explicit icon instead of patching Leaflet's global
// L.Icon.Default. The pin is the brand's own (redesign): a forest drop with
// the ball in it and a lime outline, so it reads on both the light map and
// the darkened one. Still an image icon, not a divIcon — the marker keeps
// its `alt`, which is how a screen reader (and the e2e spec) finds a club.
export const markerIconDefault = icon({
  iconUrl: "/leaflet/marker-pin.svg",
  iconSize: [32, 42],
  iconAnchor: [16, 41],
  popupAnchor: [0, -36],
  tooltipAnchor: [16, -28],
});
