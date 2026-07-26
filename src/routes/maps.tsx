import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin, Navigation, Store as StoreIcon, Sparkles, Tag } from "lucide-react";
import { stores, deals, getStore } from "@/data/deals";

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
    setOptions({ key: apiKey, v: "weekly" });
    (async () => {
      try {
        const { Map } = await importLibrary("maps");
        const { Marker } = await importLibrary("marker");
        if (cancelled || !mapRef.current) return;
        const map = new Map(mapRef.current, { center: userLocation, zoom: 13 });
        deals.forEach((deal) => {
          const seed = deal.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const pos = {
            lat: userLocation.lat + (Math.sin(seed) * 0.02),
            lng: userLocation.lng + (Math.cos(seed) * 0.02),
          };
          const store = getStore(deal.storeId);
          const marker = new Marker({ 
            position: pos, 
            map, 
            title: `${store.name}: ${deal.title}`,
            label: {
              text: deal.image.startsWith('http') ? '🏷️' : deal.image,
              fontSize: '20px'
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="text-align: right; padding: 10px; font-family: sans-serif; min-width: 180px;">
                <img src="${deal.image}" style="width: 100%; height: 80px; object-cover: cover; border-radius: 8px; margin-bottom: 8px;" />
                <h3 style="margin: 0 0 4px; font-size: 14px; color: #1a1a1a;">${deal.title}</h3>
                <p style="margin: 0 0 8px; font-size: 11px; color: #D4AF37; font-weight: bold;">${store.name}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; pt: 8px;">
                  <span style="color: #D4AF37; font-weight: 900;">${deal.price} ريال</span>
                  <span style="font-size: 10px; color: #ff4d4d; background: #fff0f0; padding: 2px 6px; border-radius: 4px;">خصم ${Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100)}%</span>
                </div>
              </div>
            `
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });
        });
      } catch {
        setError("تعذّر تحميل الخريطة.");
      }
    })();
    return () => { cancelled = true; };
  }, [apiKey, userLocation]);

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-6">
      <header className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-gold glow-gold flex items-center justify-center">
            <MapPin className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl md:text-3xl">خريطة العروض</h1>
            <p className="text-sm text-muted-foreground">اكتشف أفضل العروض القريبة منك بالذكاء الاقتصادي</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-2xl border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-bold text-gold-shine">عروض حصرية حولك</span>
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
