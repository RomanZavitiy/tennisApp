"use client";

import "leaflet/dist/leaflet.css";

import { latLngBounds, type Marker as LeafletMarker } from "leaflet";
import Link from "next/link";
import { type RefObject, useEffect, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { useClubSelection } from "@/components/club-selection";

import { markerIconDefault } from "./marker-icon";

// Rynek Główny, the middle of the city: the view while there are no clubs.
const KRAKOW_CENTER: [number, number] = [50.0614, 19.9366];
const DEFAULT_ZOOM = 13;
// Close enough to see the streets around a club picked in the list; also the
// closest the first view gets, so a lone club isn't shown at street level.
const SELECTED_ZOOM = 15;
// Room around the outermost markers in the first view, so none sits on the edge.
const FIT_PADDING: [number, number] = [32, 32];

export type ClubMapMarker = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type ClubMapProps = {
  markers: ClubMapMarker[];
};

// Leaflet touches `window` as soon as it is imported, so this module must only
// ever load in the browser — import it through ./index.tsx, never directly.
// The map fills its parent; the wrapper in ./index.tsx sets the size.
// Inside ClubsView it follows the club selection shared with the list (2.7).
export default function ClubMap({ markers }: ClubMapProps) {
  const clubSelection = useClubSelection();
  const leafletMarkers = useRef(new Map<string, LeafletMarker>());
  // Whether the map has its first view: all clubs fitted (2.12), or a club
  // picked in the list before the map was ever shown (on a phone).
  const hasViewRef = useRef(false);

  return (
    <MapContainer
      center={KRAKOW_CENTER}
      zoom={DEFAULT_ZOOM}
      // Leaflet's panes and controls use z-indexes up to 1000; a stacking
      // context keeps them below the header and the mobile menu.
      className="isolate h-full w-full"
    >
      {/* OSM tile usage policy: attribution is mandatory and must link to the copyright page. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={markerIconDefault}
          title={marker.name}
          alt={marker.name}
          ref={(leafletMarker) => {
            if (!leafletMarker) return;
            leafletMarkers.current.set(marker.id, leafletMarker);
            return () => {
              leafletMarkers.current.delete(marker.id);
            };
          }}
          // A marker click opens its popup by itself; the list only needs to
          // know which club it is. Closing the popup unselects the club.
          eventHandlers={{
            click: () => clubSelection?.select(marker.id, "map"),
            popupclose: () => clubSelection?.clear(marker.id),
          }}
        >
          {/* react-leaflet renders the popup through a portal, so Link keeps
              client-side navigation. */}
          {/* <div>, not <p>: leaflet.css gives popup paragraphs wide margins,
              and its unlayered rules beat Tailwind's utilities. */}
          <Popup>
            <div className="font-semibold">{marker.name}</div>
            <div>{marker.address}</div>
            <Link href={`/clubs/${marker.id}`}>Club details</Link>
          </Popup>
        </Marker>
      ))}
      <FitToContainer markers={markers} hasViewRef={hasViewRef} />
      <ShowClubPickedInList
        leafletMarkers={leafletMarkers}
        hasViewRef={hasViewRef}
      />
    </MapContainer>
  );
}

// Centers the map on a club picked in the list and opens its popup.
function ShowClubPickedInList({
  leafletMarkers,
  hasViewRef,
}: {
  leafletMarkers: RefObject<Map<string, LeafletMarker>>;
  hasViewRef: RefObject<boolean>;
}) {
  const map = useMap();
  const selection = useClubSelection()?.selection;

  useEffect(() => {
    if (selection?.from !== "list") return;
    const marker = leafletMarkers.current.get(selection.id);
    if (!marker) return;
    // On a phone the click has just shown the hidden map; measure it before
    // moving, or Leaflet centers on its old 0×0 size.
    map.invalidateSize();
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), SELECTED_ZOOM));
    marker.openPopup();
    hasViewRef.current = true;
  }, [map, selection, leafletMarkers, hasViewRef]);

  return null;
}

// Leaflet measures its container once, at mount, and after window resizes.
// On phones the map starts hidden behind the List/Map switch (size 0), so it
// has to measure again whenever its container changes size. The first time
// it has a real size, it zooms to show every club (2.12) — not earlier: a
// fit on a 0×0 map picks a useless zoom.
function FitToContainer({
  markers,
  hasViewRef,
}: {
  markers: ClubMapMarker[];
  hasViewRef: RefObject<boolean>;
}) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      if (hasViewRef.current || container.clientWidth === 0) return;
      hasViewRef.current = true;
      if (markers.length === 0) return;
      map.fitBounds(
        latLngBounds(markers.map((m) => [m.latitude, m.longitude])),
        { padding: FIT_PADDING, maxZoom: SELECTED_ZOOM, animate: false },
      );
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [map, markers, hasViewRef]);
  return null;
}
