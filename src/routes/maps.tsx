import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin, Navigation, Sparkles, Tag, Clock, ChevronLeft, Locate } from "lucide-react";
import { stores, deals, getStore } from "@/data/deals";

export const Route = createFileRoute("/maps")({
  head: () => ({
    meta: [
      { title: "خريطتي — HkeeemAI" },
      { name: "description", content: "أقرب العروض والمتاجر على خريطة المملكة." },
    ],
  }),
  component: MapsPage,
});

// حساب المسافة بين نقطتين بالكيلومتر (Haversine)
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapsPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const apiKey = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;

  // توليد مواقع ثابتة للعروض حول موقع المستخدم
  const getDealPosition = useCallback((dealId: string, center: { lat: number; lng: number }) => {
    const seed = dealId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const angle = (seed * 137.5) % 360; // توزيع ذهبي
    const radius = 0.005 + (seed % 7) * 0.004; // 0.5 - 3.3 كم
    return {
      lat: center.lat + radius * Math.sin((angle * Math.PI) / 180),
      lng: center.lng + radius * Math.cos((angle * Math.PI) / 180),
    };
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع.");
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
        // موقع افتراضي: جدة
        setUserLocation({ lat: 21.5433, lng: 39.1728 });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (!apiKey || !userLocation || !mapRef.current) return;
    let cancelled = false;
    setOptions({ key: apiKey, v: "weekly" });
    (async () => {
      try {
        const { Map } = await importLibrary("maps") as google.maps.MapsLibrary;
        if (cancelled || !mapRef.current) return;

        const map = new Map(mapRef.current, {
          center: userLocation,
          zoom: 14,
          mapTypeId: "roadmap",
          styles: [
            { featureType: "all", elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1b2a" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d2d" }] },
            { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#3a3a3a" }] },
            { featureType: "poi", elementType: "geometry", stylers: [{ color: "#242424" }] },
            { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
          ],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;

        // أيقونة موقع المستخدم
        new google.maps.Marker({
          position: userLocation,
          map,
          title: "موقعك الحالي",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#D4AF37",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          zIndex: 999,
        });

        // دائرة حول موقع المستخدم
        new google.maps.Circle({
          center: userLocation,
          radius: 2000,
          map,
          fillColor: "#D4AF37",
          fillOpacity: 0.06,
          strokeColor: "#D4AF37",
          strokeOpacity: 0.3,
          strokeWeight: 1,
        });

        // إضافة نقاط العروض
        deals.forEach((deal) => {
          const pos = getDealPosition(deal.id, userLocation);
          const store = getStore(deal.storeId);
          const discount = Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100);

          const marker = new google.maps.Marker({
            position: pos,
            map,
            title: `${store.name}: ${deal.title}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#D4AF37",
              fillOpacity: 0.9,
              strokeColor: "#111111",
              strokeWeight: 2,
            },
            label: {
              text: `${discount}%`,
              color: "#111111",
              fontSize: "9px",
              fontWeight: "bold",
            },
          });

          const infoContent = `
            <div dir="rtl" style="
              font-family: 'Tajawal', sans-serif;
              background: #1a1a1a;
              color: #f5f5f5;
              border-radius: 12px;
              padding: 12px;
              min-width: 200px;
              max-width: 240px;
              border: 1px solid #D4AF37;
            ">
              <img src="${deal.image}" 
                style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px;" 
                onerror="this.style.display='none'"
              />
              <div style="font-size:13px;font-weight:900;margin-bottom:4px;color:#fff;">${deal.title}</div>
              <div style="font-size:11px;color:#D4AF37;font-weight:bold;margin-bottom:6px;">${store.name}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:15px;font-weight:900;color:#D4AF37;">${deal.price} ر.س</span>
                <span style="
                  font-size:10px;
                  background:#D4AF37;
                  color:#111;
                  padding:2px 8px;
                  border-radius:20px;
                  font-weight:900;
                ">خصم ${discount}%</span>
              </div>
              <div style="font-size:10px;color:#888;margin-top:4px;">⏱ ينتهي خلال ${deal.expiresIn}</div>
            </div>
          `;

          const infoWindow = new google.maps.InfoWindow({ content: infoContent });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
            setSelectedDeal(deal.id);
          });
        });

      } catch {
        setError("تعذّر تحميل الخريطة.");
      }
    })();
    return () => { cancelled = true; };
  }, [apiKey, userLocation, getDealPosition]);

  // العروض مرتبة حسب المسافة
  const nearbyDeals = userLocation
    ? deals
        .map((deal) => {
          const pos = getDealPosition(deal.id, userLocation);
          const km = distanceKm(userLocation.lat, userLocation.lng, pos.lat, pos.lng);
          return { ...deal, km, pos };
        })
        .sort((a, b) => a.km - b.km)
        .slice(0, 10)
    : [];

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-24 space-y-5">
      {/* Header */}
      <header className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-gold glow-gold flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl md:text-3xl">خريطتي</h1>
            <p className="text-sm text-muted-foreground">أقرب العروض حولك في المملكة</p>
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

      {/* رسالة الخطأ */}
      {error && (
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary shrink-0" />
          {error} — تم عرض موقع افتراضي (جدة)
        </div>
      )}

      {/* رسالة بدون API */}
      {!apiKey && (
        <div className="rounded-2xl bg-card border border-primary/20 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse shrink-0" />
          خرائط قوقل قيد التهيئة — يتم إعداد الاتصال.
        </div>
      )}

      {/* الخريطة */}
      <div
        ref={mapRef}
        className="w-full h-[55vh] rounded-3xl overflow-hidden border border-primary/20 shadow-glow bg-secondary/40"
      />

      {/* إحصائيات سريعة */}
      {userLocation && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border/60 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-primary">{deals.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">عرض متاح</div>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-primary">{stores.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">متجر شريك</div>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-primary">
              {nearbyDeals[0] ? `${nearbyDeals[0].km.toFixed(1)}` : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">كم أقرب عرض</div>
          </div>
        </div>
      )}

      {/* قائمة العروض القريبة */}
      {nearbyDeals.length > 0 && (
        <section>
          <h2 className="font-black text-lg mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            أقرب العروض إليك
          </h2>
          <div className="space-y-3">
            {nearbyDeals.map((deal) => {
              const store = getStore(deal.storeId);
              const discount = Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100);
              const isSelected = selectedDeal === deal.id;
              return (
                <Link
                  key={deal.id}
                  to="/deals/$id"
                  params={{ id: deal.id }}
                  className={`flex items-center gap-3 bg-card border rounded-2xl p-3 hover:border-primary transition-all hover-lift ${isSelected ? "border-primary glow-gold" : "border-border/60"}`}
                >
                  {/* صورة العرض */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-secondary/40">
                    {deal.image.startsWith("http") ? (
                      <img
                        src={deal.image}
                        alt={deal.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">{deal.image}</div>
                    )}
                  </div>

                  {/* تفاصيل العرض */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{deal.title}</div>
                    <div className="text-xs text-primary font-bold mt-0.5">{store.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{deal.expiresIn}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <MapPin className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-primary font-bold">{deal.km.toFixed(1)} كم</span>
                    </div>
                  </div>

                  {/* السعر والخصم */}
                  <div className="text-left shrink-0">
                    <div className="text-base font-black text-primary">{deal.price} <span className="text-[10px]">ر.س</span></div>
                    <div className="text-[10px] line-through text-muted-foreground">{deal.originalPrice} ر.س</div>
                    <div className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold text-center mt-1">
                      -{discount}%
                    </div>
                  </div>

                  <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
