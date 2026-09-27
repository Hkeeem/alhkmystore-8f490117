import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  MapPin,
  Navigation,
  Tag,
  Clock,
  ChevronLeft,
  Locate,
  Store as StoreIcon,
  Search,
  X,
  Filter,
  Loader2,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { stores, getStore } from "@/data/deals";
import { trackDealClick } from "@/lib/track-deal";
import { useRealDeals } from "@/hooks/use-real-deals";
import {
  nearestBranch,
  nearestCity,
  distanceKm,
  branches,
  CITIES,
  type Branch,
} from "@/data/store-branches";
import { useLiveDeals } from "@/hooks/use-live-deals";
import { useSocialOffers } from "@/hooks/use-social-offers";
import type * as Leaflet from "leaflet";
type L = typeof Leaflet;

export const Route = createFileRoute("/maps")({
  validateSearch: (search: Record<string, unknown>) => ({
    deal: typeof search.deal === "string" ? search.deal : undefined,
  }),
  component: MapsPage,
});

const GROUPS = [
  { id: "الكل", label: "الكل", icon: "🗺️", categories: [] },
  { id: "مطاعم", label: "مطاعم", icon: "🍽️", categories: ["مطاعم"] },
  { id: "متاجر", label: "متاجر", icon: "🛍️", categories: ["سوبرماركت", "إلكترونيات", "أزياء"] },
  { id: "خدمات", label: "خدمات", icon: "🧾", categories: ["صيدلية"] },
];

function MapsPage() {
  const { deal: focusDealId } = Route.useSearch();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapProvider, setMapProvider] = useState<"google" | "apple" | "balady">("google");
  
  const [selectedDeal, setSelectedDeal] = useState<string | null>(focusDealId ?? null);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("الرياض");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [groupFilter, setGroupFilter] = useState("الكل");
  const [storeFilter, setStoreFilter] = useState("الكل");
  const [radiusKm, setRadiusKm] = useState<number | "الكل">("الكل");
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef<Record<string, Leaflet.Marker>>({});
  const LRef = useRef<L | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { data: realDeals } = useRealDeals(120);
  const { data: liveDeals } = useLiveDeals(100);
  const { data: socialOffers } = useSocialOffers(60);
  const deals = useMemo(() => realDeals ?? [], [realDeals]);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setUserLocation({ lat: 24.7136, lng: 46.6753 });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setLoading(false);
        setUserLocation({ lat: 24.7136, lng: 46.6753 });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const mapped = useMemo(() => {
    if (!userLocation) return [];
    return deals
      .filter((deal) => cityFilter === "الكل" || deal.category === categoryFilter || categoryFilter === "الكل")
      .map((deal) => {
        const branch = nearestBranch(deal.storeId, userLocation) || {
          id: `${deal.storeId}-city`,
          storeId: deal.storeId,
          name: `فرع ${deal.storeId}`,
          city: "الرياض",
          lat: userLocation.lat + 0.01,
          lng: userLocation.lng + 0.01,
        };
        return { deal, branch, km: distanceKm(userLocation.lat, userLocation.lng, branch.lat, branch.lng) };
      });
  }, [userLocation, deals, cityFilter, categoryFilter]);

  const nearbyDeals = useMemo(() => [...mapped].sort((a, b) => a.km - b.km), [mapped]);

  useEffect(() => {
    if (!userLocation || !mapRef.current || mapInstanceRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;
      LRef.current = L;

      let tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      if (mapProvider === "apple") {
        tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      } else if (mapProvider === "balady") {
        tileUrl = "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";
      }

      const map = L.map(mapRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });
      mapInstanceRef.current = map;

      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

      L.marker([userLocation.lat, userLocation.lng])
        .addTo(map)
        .bindPopup("<b>موقعك الحالي</b>");

      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation, mapProvider]);

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-24 space-y-5" dir="rtl">
      <header className="flex items-center justify-between flex-wrap gap-3 bg-card p-4 rounded-3xl border border-primary/20">
        <div>
          <h1 className="font-display font-black text-2xl">الخريطة الموحدة لفروع المملكة العروض وكوبونات التخفيض</h1>
          <p className="text-sm text-muted-foreground">استكشف فروع السوبرماركت ومتاجر التجزئة مع خرائط Google التفاعلية ومواقع الفروع المتقدمة[span_4](start_span)[span_4](end_span).</p>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          className="flex items-center gap-2 bg-primary text-secondary px-4 py-2 rounded-2xl text-xs font-black"
        >
          <Navigation className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          تحديث موقعي
        </button>
      </header>

      {/* اختيار مزود الخريطة */}
      <div className="bg-card border border-primary/20 rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-primary" /> مزود الخريطة:
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setMapProvider("google")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${mapProvider === "google" ? "bg-primary text-secondary" : "bg-secondary/50 text-foreground"}`}
          >
            خرائط Google (Google Maps)[span_5](start_span)[span_5](end_span)
          </button>
          <button
            onClick={() => setMapProvider("apple")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${mapProvider === "apple" ? "bg-primary text-secondary" : "bg-secondary/50 text-foreground"}`}
          >
            خرائط أبل (Apple Maps)[span_6](start_span)[span_6](end_span)
          </button>
          <button
            onClick={() => setMapProvider("balady")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${mapProvider === "balady" ? "bg-primary text-secondary" : "bg-secondary/50 text-foreground"}`}
          >
            المستكشف البلدي (Balady)[span_7](start_span)[span_7](end_span)
          </button>
        </div>
      </div>

      {/* عرض الخريطة التفاعلية */}
      <div className="relative">
        <div ref={mapRef} className="w-full h-[60vh] rounded-3xl overflow-hidden border border-primary/25 shadow-lg bg-card" />
      </div>

      {/* قائمة العروض والفروع القريبة */}
      <section className="space-y-3">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          أقرب العروض والكوبونات المتاحة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nearbyDeals.slice(0, 6).map(({ deal, branch, km }) => {
            const store = getStore(deal.storeId);
            return (
              <div key={deal.id} className="bg-card border border-border/60 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{store.name}</span>
                  <h3 className="font-bold text-sm mt-1">{deal.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{branch.name} • {km.toFixed(1)} كم</p>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-sm font-black text-primary">{deal.price} ر.س</div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 bg-primary text-secondary text-[10px] font-black px-3 py-1.5 rounded-xl"
                  >
                    <Navigation className="w-3 h-3" /> توجيه
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
