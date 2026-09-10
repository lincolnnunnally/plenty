"use client";

import { useEffect, useId, useRef } from "react";
import { mapsDirUrl, type MapPlace } from "@/lib/maps";

type LeafletMap = {
  remove: () => void;
  fitBounds: (b: unknown, o?: unknown) => void;
  setView: (c: [number, number], z: number) => void;
};

type LeafletNS = {
  map: (el: HTMLElement) => LeafletMap & { addLayer: (l: unknown) => void };
  tileLayer: (url: string, opts: Record<string, unknown>) => { addTo: (m: unknown) => void };
  marker: (latlng: [number, number]) => {
    addTo: (m: unknown) => { bindPopup: (html: string) => unknown };
  };
  latLngBounds: (pts: [number, number][]) => unknown;
};

declare global {
  interface Window {
    L?: LeafletNS;
  }
}

let leafletLoading: Promise<LeafletNS> | null = null;

function loadLeaflet(): Promise<LeafletNS> {
  if (typeof window !== "undefined" && window.L) return Promise.resolve(window.L);
  if (leafletLoading) return leafletLoading;
  leafletLoading = new Promise((resolve, reject) => {
    const cssId = "leaflet-cdn-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error("Leaflet missing")));
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.head.appendChild(script);
  });
  return leafletLoading;
}

function text(value: string) {
  const amp = String.fromCharCode(38);
  return value.split("").map((ch) => {
    if (ch === "<") return amp + "lt;";
    if (ch === ">") return amp + "gt;";
    if (ch === "&") return amp + "amp;";
    if (ch === '"') return amp + "quot;";
    return ch;
  }).join("");
}

export function PantryMap({ places }: { places: MapPlace[] }) {
  const id = useId().replace(/:/g, "");
  const mapRef = useRef<LeafletMap | null>(null);
  const pins = places.filter((p) => p.lat != null && p.lon != null);

  useEffect(() => {
    let cancelled = false;
    const el = document.getElementById(`pantry-map-${id}`);
    if (!el || !pins.length) return;
    loadLeaflet()
      .then((L) => {
        if (cancelled) return;
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        const map = L.map(el);
        mapRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap"
        }).addTo(map);
        const pts: [number, number][] = [];
        for (const p of pins) {
          const lat = p.lat as number;
          const lon = p.lon as number;
          pts.push([lat, lon]);
          const drive = mapsDirUrl(p);
          const colorNote = p.status === "closed" ? "Do not go" : p.status === "unconfirmed" ? "Call first" : "Open";
          const body =
            "<strong>" +
            text(p.name) +
            "</strong><br/>" +
            text(p.address) +
            "<br/>" +
            text(p.hours || colorNote) +
            (drive ? '<br/><a href="' + drive + '" target="_blank" rel="noreferrer">Drive</a>' : "");
          L.marker([lat, lon]).addTo(map).bindPopup(body);
        }
        if (pts.length === 1) map.setView(pts[0], 15);
        else map.fitBounds(L.latLngBounds(pts), { padding: [28, 28], maxZoom: 13 } as never);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [id, pins.map((p) => p.id).join(",")]);

  if (!pins.length) return null;

  return (
    <div className="pantry-map-wrap">
      <div id={`pantry-map-${id}`} className="pantry-map" role="img" aria-label="Map of food pantries" />
      <p className="note">Tap a pin, then Drive. Opens Maps on your phone.</p>
    </div>
  );
}
