// src/components/Map.tsx

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@/lib/leaflet";

export interface MapMarker {
  id: string;
  title: string;
  lat: number;
  lng: number;
  price?: number;
}

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
}

export default function Map({
  center,
  zoom = 12,
  markers = [],
}: MapProps) {
  return (
    <div className="h-[500px] w-full overflow-hidden rounded-xl border">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
          >
            <Popup>
              <div className="text-right">
                <h3 className="font-bold">{marker.title}</h3>
                {marker.price && (
                  <p>{marker.price.toLocaleString()} ر.س</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
