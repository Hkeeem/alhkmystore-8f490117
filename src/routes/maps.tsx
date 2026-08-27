import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapPin, Navigation, Tag, Clock, ChevronLeft, Locate, Store as StoreIcon, Search, X, Filter, Loader2, AlertTriangle } from "lucide-react";
import { stores, deals, getStore } from "@/data/deals";
import { nearestBranch, nearestCity, distanceKm, branches, CITIES, type Branch } from "@/data/store-branches";
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

/** مجموعات رئيسية تُبسّط التصفية على الخريطة */
const GROUPS: { id: string; label: string; icon: string; categories: string[] }[] = [
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
  const [locStatus, setLocStatus] = useState<
    "idle" | "loading" | "granted" | "denied" | "unavailable" | "timeout" | "unsupported"
  >("idle");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(focusDealId ?? null);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState("");
  const [cityFilter, setCityFilter] = useState("الكل");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [groupFilter, setGroupFilter] = useState("الكل");
  const [storeFilter, setStoreFilter] = useState("الكل");
  const [radiusKm, setRadiusKm] = useState<number | "الكل">("الكل");
  const [sortBy, setSortBy] = useState<"distance" | "distance-desc" | "discount">("distance");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const focusNearestRef = useRef(false);

  const requestLocation = useCallback((focusNearest = false) => {
    focusNearestRef.current = focusNearest;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocStatus("unsupported");
      setError("متصفحك لا يدعم خدمة تحديد الموقع.");
      setUserLocation({ lat: 24.7136, lng: 46.6753 });
      return;
    }
    setLoading(true);
    setLocStatus("loading");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
        setLocStatus("granted");
        setError(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocStatus("denied");
          setError("تم رفض إذن الموقع. فعّل الإذن من إعدادات المتصفح، أو ابحث يدويًا عن المتجر أو الحي.");
        } else if (err.code === err.TIMEOUT) {
          setLocStatus("timeout");
          setError("انتهت مهلة تحديد موقعك. حاول مرة أخرى، أو ابحث يدويًا عن المتجر أو الحي.");
        } else {
          setLocStatus("unavailable");
          setError("تعذّر تحديد موقعك حاليًا (الخدمة غير متاحة). جرّب لاحقًا أو ابحث يدويًا.");
        }
        setLoading(false);
        setUserLocation({ lat: 24.7136, lng: 46.6753 });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);



  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  /** ربط كل عرض بأقرب فرع فعلي لمتجره (مع مراعاة التصفية) */
  const mapped = useMemo(() => {
    if (!userLocation) return [];
    const groupCats = GROUPS.find((g) => g.id === groupFilter)?.categories ?? [];
    return deals
      .filter((deal) => groupFilter === "الكل" || groupCats.includes(deal.category))
      .filter((deal) => categoryFilter === "الكل" || deal.category === categoryFilter)
      .filter((deal) => storeFilter === "الكل" || deal.storeId === storeFilter)
      .map((deal) => {
        const branch =
          cityFilter === "الكل"
            ? nearestBranch(deal.storeId, userLocation)
            : branches
                .filter((b) => b.storeId === deal.storeId && b.city === cityFilter)
                .sort(
                  (a, b) =>
                    distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
                    distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
                )[0] ?? null;
        if (!branch) return null;
        return {
          deal,
          branch,
          km: distanceKm(userLocation.lat, userLocation.lng, branch.lat, branch.lng),
        };
      })
      .filter(Boolean)
      .filter((m) => radiusKm === "الكل" || (m as { km: number }).km <= radiusKm) as {
      deal: (typeof deals)[number];
      branch: Branch;
      km: number;
    }[];
  }, [userLocation, cityFilter, categoryFilter, storeFilter, radiusKm, groupFilter]);

  const nearbyDeals = useMemo(
    () =>
      [...mapped].sort((a, b) =>
        sortBy === "distance"
          ? a.km - b.km
          : sortBy === "distance-desc"
            ? b.km - a.km
            : (b.deal.originalPrice - b.deal.price) / b.deal.originalPrice -
              (a.deal.originalPrice - a.deal.price) / a.deal.originalPrice
      ),
    [mapped, sortBy]
  );

  const city = userLocation ? nearestCity(userLocation) : null;

  const groupCategories = useMemo(() => {
    const cats = GROUPS.find((g) => g.id === groupFilter)?.categories ?? [];
    const all = Array.from(new Set(deals.map((d) => d.category)));
    return ["الكل", ...(groupFilter === "الكل" ? all : all.filter((c) => cats.includes(c)))];
  }, [groupFilter]);
  const categories = groupCategories;
  const activeFiltersCount =
    (cityFilter !== "الكل" ? 1 : 0) +
    (groupFilter !== "الكل" ? 1 : 0) +
    (categoryFilter !== "الكل" ? 1 : 0) +
    (storeFilter !== "الكل" ? 1 : 0) +
    (radiusKm !== "الكل" ? 1 : 0);


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

  /** اقتراحات تلقائية: متاجر، مدن، فروع، عناوين عروض */
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: { key: string; label: string; kind: string }[] = [];
    const seen = new Set<string>();
    const push = (label: string, kind: string) => {
      const k = `${kind}:${label}`;
      if (seen.has(k)) return;
      seen.add(k);
      out.push({ key: k, label, kind });
    };

    if (!q) {
      // أشهر المتاجر والمدن القريبة كاقتراحات افتتاحية
      nearbyDeals.slice(0, 6).forEach(({ deal }) => push(getStore(deal.storeId).name, "متجر"));
      nearbyDeals.slice(0, 6).forEach(({ branch }) => push(branch.city, "مدينة"));
      return out.slice(0, 8);
    }

    for (const { deal, branch } of nearbyDeals) {
      const store = getStore(deal.storeId);
      if (store.name.toLowerCase().includes(q)) push(store.name, "متجر");
      if (branch.city.toLowerCase().includes(q)) push(branch.city, "مدينة");
      if (branch.name.toLowerCase().includes(q)) push(branch.name, "فرع");
      if (deal.title.toLowerCase().includes(q)) push(deal.title, "عرض");
      if (out.length >= 20) break;
    }
    return out.slice(0, 8);
  }, [query, nearbyDeals]);



  /** إنشاء الخريطة مرة واحدة فقط — لا تُدمَّر عند تغيير الفلاتر */
  useEffect(() => {
    if (!userLocation || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120,
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

    // ضبط الأبعاد بعد تركيب الحاوية (يمنع بلاطات رمادية)
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = {};
    };
  }, [userLocation]);

  /** تحديث دبابيس العروض فقط عند تغيير الفلاتر — بدون إعادة بناء الخريطة */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    // تنظيف الدبابيس السابقة
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    if (mapped.length === 0) return;

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

  /** خيارات لوحة المفاتيح: الاقتراحات ثم النتائج */
  const options = useMemo(
    () => [
      ...suggestions.map((s, i) => ({ id: `map-opt-sug-${i}`, type: "suggestion" as const, label: s.label })),
      ...searchResults.map((r, i) => ({ id: `map-opt-res-${i}`, type: "result" as const, dealId: r.deal.id, label: r.deal.title })),
    ],
    [suggestions, searchResults]
  );

  const listboxOpen = (searchFocused || query.trim().length > 0) && options.length > 0;

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, cityFilter, categoryFilter, storeFilter]);

  useEffect(() => {
    if (!listboxOpen) return;
    setAnnouncement(
      query.trim().length > 0
        ? `${searchResults.length} نتيجة و${suggestions.length} اقتراح متاحة. استخدم الأسهم للتنقل.`
        : `${suggestions.length} اقتراح متاح. استخدم الأسهم للتنقل.`
    );
  }, [listboxOpen, searchResults.length, suggestions.length, query]);

  const selectOption = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    if (opt.type === "suggestion") {
      setQuery(opt.label);
      setActiveIndex(-1);
      setAnnouncement(`تم اختيار الاقتراح ${opt.label}`);
    } else {
      focusOnMap(opt.dealId);
      setQuery("");
      setActiveIndex(-1);
      setAnnouncement(`تم عرض ${opt.label} على الخريطة`);
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!listboxOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        selectOption(activeIndex);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveIndex(-1);
      setSearchFocused(false);
      setAnnouncement("تم إغلاق قائمة النتائج");
    }
  };


  /** بعد تحديد الموقع عبر زر "استخدم موقعي": ركّز على أقرب فرع/عرض */
  useEffect(() => {
    if (!focusNearestRef.current) return;
    const nearest = nearbyDeals[0];
    if (!nearest || !markersRef.current[nearest.deal.id]) return;
    focusNearestRef.current = false;
    focusOnMap(nearest.deal.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyDeals, mapped]);

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-24 space-y-5">
      <header className="flex items-center gap-3 justify-between flex-wrap">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => requestLocation(true)}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-secondary px-3 py-2 rounded-2xl text-xs font-black hover:opacity-90 transition press-ripple"
          >
            <Navigation className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "جاري تحديد موقعك…" : "استخدم موقعي"}
          </button>
          <button
            type="button"
            onClick={() => requestLocation(false)}
            disabled={loading}
            className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-2xl border border-primary/20 text-xs font-bold text-primary hover:border-primary transition"
          >
            <Locate className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث موقعي
          </button>
        </div>
      </header>


      {locStatus === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl bg-card border border-primary/20 p-4 text-sm flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" aria-hidden="true" />
          <span>جاري تحديد موقعك… قد يطلب المتصفح إذن الوصول للموقع.</span>
        </div>
      )}

      {error && locStatus !== "loading" && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl bg-card border border-destructive/40 p-4 text-sm space-y-3"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-bold text-foreground">
                {locStatus === "denied" ? "إذن الموقع مرفوض" : "تعذّر تحديد موقعك"}
              </p>
              <p className="text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground">
                عرضنا الخريطة على موقع افتراضي (الرياض) حتى تتمكن من التصفح.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {locStatus !== "unsupported" && (
              <button
                type="button"
                onClick={() => requestLocation(true)}
                disabled={loading}
                className="flex items-center gap-1.5 bg-primary text-secondary px-3 py-2 rounded-xl text-xs font-black hover:opacity-90 transition press-ripple disabled:opacity-60"
              >
                <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                إعادة المحاولة
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchFocused(true);
                searchInputRef.current?.focus();
                searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="flex items-center gap-1.5 bg-secondary/50 border border-primary/20 text-primary px-3 py-2 rounded-xl text-xs font-bold hover:border-primary transition"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              ابحث يدويًا عن المتجر أو الحي
            </button>
          </div>
        </div>
      )}


      <div className="relative">
        <div
          className="flex items-center gap-2 bg-card border border-primary/20 rounded-2xl px-3 py-2.5"
          role="combobox"
          aria-expanded={listboxOpen}
          aria-owns="map-search-listbox"
          aria-haspopup="listbox"
        >
          <Search className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <input
            id="map-search-input"
            ref={searchInputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            onKeyDown={onSearchKeyDown}
            placeholder="ابحث باسم المتجر أو اسم العرض أو الفرع…"
            aria-label="بحث داخل الخريطة"
            aria-autocomplete="list"
            aria-controls="map-search-listbox"
            aria-activedescendant={activeIndex >= 0 ? options[activeIndex]?.id : undefined}
            aria-describedby="map-search-help"
            autoComplete="off"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
              }}
              aria-label="مسح البحث"
              className="min-h-11 min-w-11 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </button>
          )}
        </div>

        <p id="map-search-help" className="sr-only">
          استخدم سهمي الأعلى والأسفل للتنقل بين الاقتراحات والنتائج، Enter للاختيار، Escape للإغلاق.
        </p>
        <div aria-live="polite" role="status" className="sr-only">
          {announcement}
        </div>

        {listboxOpen && (
          <div id="map-search-listbox" role="listbox" aria-label="اقتراحات ونتائج بحث الخريطة">
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={s.key}
                    id={`map-opt-sug-${i}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === i}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => selectOption(i)}
                    className={`max-w-[220px] truncate border text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition ${
                      activeIndex === i
                        ? "bg-secondary border-primary ring-2 ring-primary/40"
                        : "bg-secondary/50 border-primary/20 hover:border-primary"
                    }`}
                  >
                    <span className="text-primary">{s.kind}:</span> {s.label}
                  </button>
                ))}
              </div>
            )}

            {query.trim().length > 0 && (
              <div className="absolute z-[1000] mt-2 w-full max-h-72 overflow-y-auto bg-card border border-primary/20 rounded-2xl shadow-glow divide-y divide-border/50">
                {searchResults.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground text-center">لا توجد نتائج مطابقة</div>
                )}
                {searchResults.map(({ deal, branch, km }, i) => {
                  const idx = suggestions.length + i;
                  return (
                    <button
                      key={deal.id}
                      id={`map-opt-res-${i}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === idx}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectOption(idx)}
                      className={`w-full text-right p-3 transition flex items-center justify-between gap-3 ${
                        activeIndex === idx ? "bg-secondary/60" : "hover:bg-secondary/40"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-bold truncate">{deal.title}</span>
                        <span className="block text-[11px] text-muted-foreground truncate">
                          {getStore(deal.storeId).name} · {branch.name}
                        </span>
                      </span>
                      <span className="text-[11px] font-black text-primary shrink-0">{km.toFixed(1)} كم</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>


      {/* تصفية نتائج الخريطة */}
      <section className="bg-card border border-border/60 rounded-2xl p-3 space-y-3" aria-label="تصفية نتائج الخريطة">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-black">
            <Filter className="w-4 h-4 text-primary" />
            تصفية النتائج
            {activeFiltersCount > 0 && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">
                {activeFiltersCount} فلتر
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setCityFilter("الكل");
                setCategoryFilter("الكل");
                setStoreFilter("الكل");
                setRadiusKm("الكل");
                setGroupFilter("الكل");
              }}
              className="text-[11px] font-bold text-muted-foreground hover:text-primary transition"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-[10px] text-muted-foreground mb-1">المدينة</span>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full bg-secondary/40 border border-primary/20 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-primary"
            >
              <option value="الكل">كل المدن</option>
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[10px] text-muted-foreground mb-1">التاجر</span>
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="w-full bg-secondary/40 border border-primary/20 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-primary"
            >
              <option value="الكل">كل التجّار</option>
              {stores
                .filter((s) => categoryFilter === "الكل" || s.category === categoryFilter)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-[10px] text-muted-foreground mb-1">نطاق المسافة</span>
            <select
              value={String(radiusKm)}
              onChange={(e) => setRadiusKm(e.target.value === "الكل" ? "الكل" : Number(e.target.value))}
              className="w-full bg-secondary/40 border border-primary/20 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-primary"
            >
              <option value="الكل">كل المسافات</option>
              <option value="5">خلال 5 كم</option>
              <option value="10">خلال 10 كم</option>
              <option value="25">خلال 25 كم</option>
              <option value="50">خلال 50 كم</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-[10px] text-muted-foreground mb-1">ترتيب النتائج</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "distance" | "distance-desc" | "discount")}
              className="w-full bg-secondary/40 border border-primary/20 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-primary"
            >
              <option value="distance">الأقرب لموقعي</option>
              <option value="distance-desc">الأبعد عن موقعي</option>
              <option value="discount">الأعلى خصمًا</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية حسب الفئة الرئيسية">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={groupFilter === g.id}
              onClick={() => {
                setGroupFilter(g.id);
                setCategoryFilter("الكل");
                setStoreFilter("الكل");
              }}
              className={`text-[11px] font-black px-3 py-1.5 rounded-xl border transition ${
                groupFilter === g.id
                  ? "bg-primary text-secondary border-primary"
                  : "bg-secondary/40 border-primary/20 hover:border-primary"
              }`}
            >
              <span className="ml-1">{g.icon}</span>
              {g.label}
            </button>
          ))}
        </div>


        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={categoryFilter === c}
              onClick={() => {
                setCategoryFilter(c);
                setStoreFilter("الكل");
              }}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition ${
                categoryFilter === c
                  ? "bg-primary text-secondary border-primary"
                  : "bg-secondary/40 border-primary/20 hover:border-primary"
              }`}
            >
              {c === "الكل" ? "كل الأنواع" : c}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-muted-foreground">
          {nearbyDeals.length > 0
            ? `${nearbyDeals.length} عرض مطابق`
            : "لا توجد عروض مطابقة لهذه التصفية — جرّب توسيع الخيارات"}
        </div>
      </section>



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
