'use client';

import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  store: string;
  price: number;
  lat: number;
  lng: number;
  distance: number;
}

export default function StoreMap() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const apiKey = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;

  // الحصول على موقع المستخدم
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => alert("يرجى تفعيل الموقع لعرض العروض القريبة")
    );
  }, []);

  // تحميل الخريطة + العروض
  useEffect(() => {
    if (!apiKey || !userLocation) return;

    const loader = new Loader({ apiKey, version: "weekly" });

    loader.load().then(() => {
      const map = new google.maps.Map(document.getElementById("map")!, {
        center: userLocation,
        zoom: 14,
      });

      // AI Mock Offers (يمكن استبدالها بـ API حقيقي)
      const mockOffers: Offer[] = [
        { id: "1", title: "خصم 50% على الحليب", store: "بنده", price: 12.5, lat: userLocation.lat + 0.01, lng: userLocation.lng + 0.01, distance: 1.2 },
        { id: "2", title: "آيفون 16 بخصم", store: "جرير", price: 3499, lat: userLocation.lat + 0.02, lng: userLocation.lng - 0.015, distance: 2.5 },
      ];

      setOffers(mockOffers);

      mockOffers.forEach((offer) => {
        const marker = new google.maps.Marker({
          position: { lat: offer.lat, lng: offer.lng },
          map,
          title: offer.store,
        });

        // عند الضغط على الـ Marker
        marker.addListener("click", () => {
          const directionsService = new google.maps.DirectionsService();
          const directionsRenderer = new google.maps.DirectionsRenderer();

          directionsRenderer.setMap(map);

          directionsService.route({
            origin: userLocation,
            destination: { lat: offer.lat, lng: offer.lng },
            travelMode: google.maps.TravelMode.DRIVING,
          }, (response, status) => {
            if (status === "OK") {
              directionsRenderer.setDirections(response);
              alert(`التوجه إلى ${offer.store} - ${offer.title}`);
            }
          });
        });
      });
    });
  }, [userLocation, apiKey]);

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">🗺️ العروض القريبة منك</h3>
        <div className="text-emerald-400 text-sm">موقعك الحالي مفعل</div>
      </div>
      
      <div id="map" className="w-full h-96 rounded-3xl border border-zinc-700"></div>

      {/* قائمة العروض */}
      <div className="mt-6 grid gap-4">
        {offers.map(offer => (
          <div key={offer.id} className="bg-zinc-900 p-4 rounded-2xl flex justify-between items-center">
            <div>
              <div className="font-semibold">{offer.title}</div>
              <div className="text-emerald-400">{offer.store} • {offer.distance} كم</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">{offer.price} ر.س</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
