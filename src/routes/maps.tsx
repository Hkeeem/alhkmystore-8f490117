import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin, Navigation, Store as StoreIcon } from "lucide-react";
import { stores } from "@/data/deals";

export const Route = createFileRoute("/maps")({
  head: () => ({
    meta: [
      { title: "الخرائط — HkeeemAI" },
      { name: "description", content: "أقرب المتاجر والعروض على الخريطة." },
    ],
  }),
  component: MapsPage,
});

function MapsPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const apiKey = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("يرجى السماح بالوصول للموقع لعرض العروض القريبة."),
    );
  }, []);

  useEffect(() => {
    if (!apiKey || !userLocation || !mapRef.current) return;
    let cancelled = false;
    const loader = new Loader({ apiKey, version: "weekly" });
    loader.importLibrary("maps").then(async ({ Map }) => {
      if (cancelled || !mapRef.current) return;
      const { Marker } = (await loader.importLibrary("marker")) as google.maps.MarkerLibrary;
      const map = new Map(mapRef.current, { center: userLocation, zoom: 13, disableDefaultUI: false });
      // Demo nearby offers around the user
      const offers = [
        { lat: userLocation.lat + 0.008, lng: userLocation.lng + 0.011, title: "بنده — خصم 50٪ على المنظفات" },
        { lat: userLocation.lat + 0.014, lng: userLocation.lng - 0.007, title: "جرير — عرض على AirPods Pro" },
        { lat: userLocation.lat - 0.006, lng: userLocation.lng + 0.004, title: "النهدي — فيتامين C خصم 50٪" },
      ];
      offers.forEach((o) => new Marker({ position: { lat: o.lat, lng: o.lng }, map, title: o.title }));
    }).catch(() => setError("تعذّر تحميل الخريطة."));
    return () => { cancelled = true; };
  }, [apiKey, userLocation]);

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-gold glow-gold flex items-center justify-center">
          <MapPin className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl md:text-3xl">الخرائط</h1>
          <p className="text-sm text-muted-foreground">أقرب المتاجر والعروض حولك</p>
        </div>
      </header>

      {!apiKey && (
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary" /> الخرائط قيد التهيئة — يتم إعداد الاتصال بخرائط قوقل.
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-sm text-muted-foreground">{error}</div>
      )}

      <div ref={mapRef} className="w-full h-[60vh] rounded-3xl overflow-hidden border border-border/60 shadow-card bg-secondary/40" />

      <section>
        <h2 className="font-black text-lg mb-3 flex items-center gap-2"><StoreIcon className="w-4 h-4 text-primary" /> متاجر شريكة</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stores.map((s) => (
            <div key={s.id} className="shrink-0 rounded-2xl bg-card border border-border/60 px-3 py-2 text-xs font-bold whitespace-nowrap">
              {s.name}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
