import { icon } from "leaflet";

// Leaflet's default icon finds its images through a path in leaflet.css,
// which breaks once a bundler moves the CSS — markers then fail to render.
// So every marker gets this explicit icon instead of patching Leaflet's global
// L.Icon.Default. The PNGs are copies of leaflet/dist/images (1.9.4) in
// public/leaflet/: importing them from node_modules gives a plain URL string
// under Turbopack, not the StaticImageData its types promise. Sizes are
// Leaflet's own defaults for these images.
export const markerIconDefault = icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
