import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapPin, Navigation, Tag, Clock, ChevronLeft, Locate, Store as StoreIcon, Search, X } from "lucide-react";
import { stores, deals, getStore } from "@/data/deals";
import { nearestBranch, nearestCity, distanceKm, type Branch } from "@/data/store-branches";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/maps")({
  validateSearch: (search: Record<string, unknown>) => ({
    deal: typeof search.deal === "string" ? search.deal : undefined,
  }),
  head: () => ({
    meta: [
      { title: "خريطتي — HkeeemAI" },
      { name: "description", content: "أقرب العروض والمتاجر على خريطة المملكة مع فروع حقيقية وتوجيه مباشر." },
    ],
  }),
  component: MapsPage,
});

function MapsPage() {
  const { deal: focusDealId } = Route.useSearch();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(focusDealId ?? null);
  const [query, setQuery] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع.");
      setUserLocation({ lat: 24.7136, lng: 46.6753 });
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setError("يرجى السماح بالوصول للموقع لعرض العروض القريبة.");
        setLoading(false);
        setUserLocation({ lat: 24.7136, lng: 46.6753 });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  /** ربط كل عرض بأقرب فرع فعلي لمتجره */
  const mapped = useMemo(() => {
    if (!userLocation) return [];
    return deals
      .map((deal) => {
        const branch = nearestBranch(deal.storeId, userLocation);
        if (!branch) return null;
        return {
          deal,
          branch,
          km: distanceKm(userLocation.lat, userLocation.lng, branch.lat, branch.lng),
        };
      })
      .filter(Boolean) as { deal: (typeof deals)[number]; branch: Branch; km: number }[];
  }, [userLocation]);

  const nearbyDeals = useMemo(() => [...mapped].sort((a, b) => a.km - b.km), [mapped]);
  const city = userLocation ? nearestCity(userLocation) : null;

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return nearbyDeals
      .filter(({ deal, branch }) => {
        const store = getStore(deal.storeId);
        return (
          deal.title.toLowerCase().includes(q) ||
          store.name.toLowerCase().includes(q) ||
          branch.name.toLowerCase().includes(q) ||
          branch.city.toLowerCase().includes(q)
        );
      })
      .slice(0, 15);
  }, [query, nearbyDeals]);


  useEffect(() => {
    if (!userLocation || !mapRef.current || mapped.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    markersRef.current = {};

    const map = L.map(mapRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    const userIcon = L.divIcon({
      className: "",
      html: `<div style="width:20px;height:20px;background:#D4AF37;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(212,175,55,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map).bindPopup("<b>موقعك الحالي</b>");

    L.circle([userLocation.lat, userLocation.lng], {
      radius: 3000,
      color: "#D4AF37",
      fillColor: "#D4AF37",
      fillOpacity: 0.06,
      weight: 1,
      opacity: 0.3,
    }).addTo(map);

    // تجميع العروض حسب الفرع: كل فرع دبوس واحد يعرض كل عروضه
    const byBranch = new Map<string, { branch: Branch; items: typeof mapped }>();
    for (const row of mapped) {
      const entry = byBranch.get(row.branch.id) ?? { branch: row.branch, items: [] };
      entry.items.push(row);
      byBranch.set(row.branch.id, entry);
    }

    const bounds: [number, number][] = [[userLocation.lat, userLocation.lng]];

    byBranch.forEach(({ branch, items }) => {
      const store = getStore(branch.storeId);
      const best = items.reduce((a, b) => {
        const da = Math.round(((a.deal.originalPrice - a.deal.price) / a.deal.originalPrice) * 100);
        const db = Math.round(((b.deal.originalPrice - b.deal.price) / b.deal.originalPrice) * 100);
        return db > da ? b : a;
      });
      const bestOff = Math.round(
        ((best.deal.originalPrice - best.deal.price) / best.deal.originalPrice) * 100
      );

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="background:#D4AF37;color:#111;font-size:10px;font-weight:900;font-family:'Tajawal',sans-serif;padding:3px 7px;border-radius:20px;border:2px solid #fff;box-shadow:0 2px 8px rgba(212,175,55,0.6);white-space:nowrap;">
              ${store.name} · ${items.length} عرض
            </div>
            <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #D4AF37;margin-top:-1px;"></div>
          </div>`,
        iconSize: [90, 30],
        iconAnchor: [45, 30],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([branch.lat, branch.lng], { icon }).addTo(map);
      bounds.push([branch.lat, branch.lng]);

      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`;
      const rows = items
        .slice(0, 5)
        .map(
          (r) => `
          <a href="/deals/${r.deal.id}" style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid #eee;text-decoration:none;color:#111;">
            <span style="font-size:11px;font-weight:700;">${r.deal.title}</span>
            <span style="font-size:11px;font-weight:900;color:#B8860B;white-space:nowrap;">${r.deal.price} ر.س</span>
          </a>`
        )
        .join("");

      marker.bindPopup(`
        <div dir="rtl" style="font-family:'Tajawal',sans-serif;min-width:210px;max-width:250px;">
          <div style="font-size:13px;font-weight:900;">${branch.name}</div>
          <div style="font-size:11px;color:#888;margin-bottom:6px;">${items.length} عرض · أفضل خصم ${bestOff}%</div>
          ${rows}
          <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;margin-top:10px;background:#D4AF37;color:#111;font-size:12px;font-weight:900;font-family:'Tajawal',sans-serif;padding:7px 12px;border-radius:12px;text-decoration:none;">🧭 ابدأ التوجيه للفرع</a>
        </div>`);

      items.forEach((r) => {
        markersRef.current[r.deal.id] = marker;
      });
      marker.on("click", () => setSelectedDeal(items[0].deal.id));
    });

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });

    // فتح العرض القادم من رابط عميق
    if (focusDealId && markersRef.current[focusDealId]) {
      const m = markersRef.current[focusDealId];
      map.setView(m.getLatLng(), 14, { animate: true });
      m.openPopup();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = {};
    };
  }, [userLocation, mapped, focusDealId]);

  const focusOnMap = (dealId: string) => {
    setSelectedDeal(dealId);
    const marker = markersRef.current[dealId];
    const map = mapInstanceRef.current;
    if (marker && map) {
      map.setView(marker.getLatLng(), 15, { animate: true });
      marker.openPopup();
      mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-24 space-y-5">
      <header className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-gold glow-gold flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl md:text-3xl">خريطتي</h1>
            <p className="text-sm text-muted-foreground">
              العروض مربوطة بفروع المتاجر {city ? `— أقرب مدينة: ${city.name}` : ""}
            </p>
          </div>
        </div>
        <button
          onClick={requestLocation}
          disabled={loading}
          className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-2xl border border-primary/20 text-xs font-bold text-primary hover:border-primary transition"
        >
          <Locate className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "جاري..." : "تحديث موقعي"}
        </button>
      </header>

      {error && (
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary shrink-0" />
          {error} — تم عرض موقع افتراضي (الرياض)
        </div>
      )}

      <div className="relative">
        <div className="flex items-center gap-2 bg-card border border-primary/20 rounded-2xl px-3 py-2.5">
          <Search className="w-4 h-4 text-primary shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم المتجر أو اسم العرض أو الفرع…"
            aria-label="بحث داخل الخريطة"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="مسح البحث">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {query.trim().length > 0 && (
          <div className="absolute z-[1000] mt-2 w-full max-h-72 overflow-y-auto bg-card border border-primary/20 rounded-2xl shadow-glow divide-y divide-border/50">
            {searchResults.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">لا توجد نتائج مطابقة</div>
            )}
            {searchResults.map(({ deal, branch, km }) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => {
                  focusOnMap(deal.id);
                  setQuery("");
                }}
                className="w-full text-right p-3 hover:bg-secondary/40 transition flex items-center justify-between gap-3"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold truncate">{deal.title}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">
                    {getStore(deal.storeId).name} · {branch.name}
                  </span>
                </span>
                <span className="text-[11px] font-black text-primary shrink-0">{km.toFixed(1)} كم</span>
              </button>
            ))}
          </div>
        )}
      </div>


      <div
        ref={mapRef}
        className="w-full h-[55vh] rounded-3xl overflow-hidden border border-primary/20 shadow-glow"
        style={{ background: "#e8e0d5" }}
      />

      {userLocation && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border/60 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-primary">{deals.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">عرض مربوط بفرع</div>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-primary">{stores.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">متجر شريك</div>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-primary">
              {nearbyDeals[0] ? nearbyDeals[0].km.toFixed(1) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">كم أقرب فرع</div>
          </div>
        </div>
      )}

      {nearbyDeals.length > 0 && (
        <section>
          <h2 className="font-black text-lg mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            أقرب العروض إليك
          </h2>
          <div className="space-y-3">
            {nearbyDeals.slice(0, 12).map(({ deal, branch, km }) => {
              const store = getStore(deal.storeId);
              const discount = Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100);
              const isSelected = selectedDeal === deal.id;
              return (
                <div
                  key={deal.id}
                  className={`flex items-center gap-3 bg-card border rounded-2xl p-3 transition-all hover-lift ${isSelected ? "border-primary glow-gold" : "border-border/60"}`}
                >
                  <button
                    type="button"
                    onClick={() => focusOnMap(deal.id)}
                    aria-label={`عرض ${deal.title} على الخريطة`}
                    className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-secondary/40"
                  >
                    {deal.image.startsWith("http") ? (
                      <img
                        src={deal.image}
                        alt={deal.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">{deal.image}</div>
                    )}
                  </button>

                  <Link to="/deals/$id" params={{ id: deal.id }} className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{deal.title}</div>
                    <div className="text-xs text-primary font-bold mt-0.5 flex items-center gap-1">
                      <StoreIcon className="w-3 h-3" />
                      {store.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">{branch.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{deal.expiresIn}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <MapPin className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-primary font-bold">{km.toFixed(1)} كم</span>
                    </div>
                  </Link>

                  <div className="text-left shrink-0">
                    <div className="text-base font-black text-primary">
                      {deal.price} <span className="text-[10px]">ر.س</span>
                    </div>
                    <div className="text-[10px] line-through text-muted-foreground">{deal.originalPrice} ر.س</div>
                    <div className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold text-center mt-1">
                      -{discount}%
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => focusOnMap(deal.id)}
                      className="flex items-center gap-1 bg-secondary/60 text-primary text-[10px] font-black px-2 py-1 rounded-xl hover:bg-secondary transition"
                    >
                      <MapPin className="w-3 h-3" />
                      الخريطة
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-primary text-secondary text-[10px] font-black px-2 py-1 rounded-xl hover:opacity-90 transition"
                    >
                      <Navigation className="w-3 h-3" />
                      توجيه
                    </a>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
