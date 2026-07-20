'use client';

import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function StoreMap() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const apiKey = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("يرجى تفعيل الموقع")
    );
  }, []);

  useEffect(() => {
    if (!apiKey || !userLocation) return;

    const loader = new Loader({ apiKey, version: "weekly" });
    loader.load().then(() => {
      const map = new google.maps.Map(document.getElementById("map")!, {
        center: userLocation,
        zoom: 14,
      });

      // عروض وهمية (يمكن ربطها بـ API)
      const offers = [
        { lat: userLocation.lat + 0.01, lng: userLocation.lng + 0.01, title: "بنده - خصم 50%" },
        { lat: userLocation.lat + 0.02, lng: userLocation.lng - 0.01, title: "جرير - آيفون" },
      ];

      offers.forEach(offer => {
        const marker = new google.maps.Marker({
          position: { lat: offer.lat, lng: offer.lng },
          map,
          title: offer.title,
        });

        marker.addListener("click", () => {
          alert(`التوجه إلى: ${offer.title}`);
          // يمكن إضافة Directions API هنا
        });
      });
    });
  }, [userLocation, apiKey]);

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-4">🗺️ العروض القريبة</h3>
      <div id="map" className="w-full h-96 rounded-3xl"></div>
    </div>
  );
}
