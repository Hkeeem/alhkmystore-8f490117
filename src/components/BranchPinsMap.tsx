import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type * as Leaflet from "leaflet";
import type { RealBranch } from "@/lib/real-branches";

export type MapStyle = "map" | "satellite" | "terrain";

const TILES: Record<MapStyle, { url: string; attribution: string; maxZoom: number }> = {
  map: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "© OpenStreetMap", maxZoom: 19 },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
    maxZoom: 19,
  },
  terrain: { url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attribution: "© OpenTopoMap", maxZoom: 17 },
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** خريطة تفاعلية بثلاثة أنماط، كل دبوس فرع يفتح صفحة تفاصيله */
export function BranchPinsMap({
  branches,
  style,
  selectedId,
  me,
}: {
  branches: RealBranch[];
  style: MapStyle;
  selectedId?: string | null;
  me?: { lat: number; lng: number } | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const tileRef = useRef<Leaflet.TileLayer | null>(null);
  const pinsRef = useRef<Leaflet.LayerGroup | null>(null);
  const markers = useRef<Record<string, Leaflet.Marker>>({});
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(el.current, { zoomControl: true }).setView([24.7136, 46.6753], 11);
      mapRef.current = map;
      pinsRef.current = L.layerGroup().addTo(map);
      setTick((t) => t + 1);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = LRef.current, map = mapRef.current;
    if (!L || !map) return;
    tileRef.current?.remove();
    const t = TILES[style];
    tileRef.current = L.tileLayer(t.url, { maxZoom: t.maxZoom, attribution: t.attribution }).addTo(map);
  }, [style, tick]);

  useEffect(() => {
    const L = LRef.current, map = mapRef.current, group = pinsRef.current;
    if (!L || !map || !group) return;
    group.clearLayers();
    markers.current = {};
    const pts: [number, number][] = [];
    for (const b of branches) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:hsl(var(--primary, 150 70% 40%));color:#fff;font:700 11px Tajawal,sans-serif;padding:4px 8px;border-radius:14px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);white-space:nowrap">📍 ${esc(b.store_name)}</div>`,
        iconSize: [100, 26],
        iconAnchor: [50, 26],
      });
      const m = L.marker([b.lat, b.lng], { icon, title: b.name }).addTo(group);
      m.bindTooltip(esc(b.name), { direction: "top", offset: [0, -24] });
      m.on("click", () => navigate({ to: "/branches/$id", params: { id: b.id } }));
      markers.current[b.id] = m;
      pts.push([b.lat, b.lng]);
    }
    if (me) {
      L.circleMarker([me.lat, me.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#D4AF37", fillOpacity: 1 }).addTo(group);
    }
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    else if (me) map.setView([me.lat, me.lng], 12);
  }, [branches, me, tick, navigate]);

  useEffect(() => {
    const b = branches.find((x) => x.id === selectedId);
    if (b && mapRef.current) mapRef.current.setView([b.lat, b.lng], 15);
  }, [selectedId, branches]);

  return <div ref={el} className="w-full h-80 z-0" aria-label="خريطة الفروع" />;
}
