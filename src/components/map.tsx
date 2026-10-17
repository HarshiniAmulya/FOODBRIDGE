"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label?: string;
  sub?: string;
  pulse?: boolean;
}

function makeIcon(color: string, pulse: boolean, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="fb-marker ${pulse ? "fb-pulse" : ""} ${active ? "fb-active" : ""}" style="--c:${color}"><div class="fb-dot"></div></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function FlyTo({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 13), { duration: 0.9 });
  }, [target, map]);
  return null;
}

export const BENGALURU: [number, number] = [12.9629, 77.6125];

export function RescueMap({
  markers,
  activeId,
  onMarkerClick,
  center = BENGALURU,
  zoom = 12,
  className = "",
}: {
  markers: MapMarker[];
  activeId?: string | null;
  onMarkerClick?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}) {
  const active = markers.find((m) => m.id === activeId) ?? null;
  return (
    <div className={`overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        style={{ minHeight: 300 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <FlyTo target={active} />
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={makeIcon(m.color, !!m.pulse, m.id === activeId)}
            eventHandlers={{ click: () => onMarkerClick?.(m.id) }}
          >
            {(m.label || m.sub) && (
              <Popup>
                <p className="text-sm font-bold">{m.label}</p>
                {m.sub && <p className="text-xs opacity-70">{m.sub}</p>}
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/* ---------------- Click-to-pick location ---------------- */

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  value,
  onPick,
  className = "",
}: {
  value: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-ink/15 ${className}`}>
      <MapContainer
        center={value ? [value.lat, value.lng] : BENGALURU}
        zoom={12}
        className="h-full w-full"
        style={{ minHeight: 260 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ClickHandler onPick={onPick} />
        {value && (
          <Marker position={[value.lat, value.lng]} icon={makeIcon("#c8441c", true, true)} />
        )}
      </MapContainer>
    </div>
  );
}
