"use client";

import "leaflet/dist/leaflet.css";

import Link from "next/link";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { markerIconDefault } from "./marker-icon";

// Rynek Główny: the middle of the city, so every club fits around it.
const KRAKOW_CENTER: [number, number] = [50.0614, 19.9366];
const DEFAULT_ZOOM = 13;

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
export default function ClubMap({ markers }: ClubMapProps) {
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
      <FitToContainer />
    </MapContainer>
  );
}

// Leaflet measures its container once, at mount, and after window resizes.
// On phones the map starts hidden behind the List/Map switch (size 0), so it
// has to measure again whenever its container changes size.
function FitToContainer() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
    };
  }, [map]);
  return null;
}
