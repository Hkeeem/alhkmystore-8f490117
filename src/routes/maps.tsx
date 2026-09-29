import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, Loader2, MapPin, Navigation, Search, X, AlertTriangle, Tag } from "lucide-react";
import { useLiveDeals } from "@/hooks/use-live-deals";
import { useSocialOffers } from "@/hooks/use-social-offers";
import { useStoreBranches } from "@/hooks/use-store-branches";
import { CITIES } from "@/data/cities";
import { trackDealClick } from "@/lib/track-deal";
import type * as Leaflet from "leaflet";

export const Route = createFileRoute("/maps")({
  validateSearch: (search: Record<string, unknown>) => ({
    deal: typeof search.deal === "string" ? search.deal : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Hkeeem Map — خريطة العروض القريبة منك" },
      {
        name: "description",
        content:
          "Hkeeem Map: خريطتك التفاعلية لاستكشاف مواقع عروض التجار والعروض الحصرية في المملكة، مع أنواع خرائط متعددة وتوجيه مباشر.",
      },
      { property: "og:title", content: "Hkeeem Map — خريطة العروض القريبة منك" },
      {
        property: "og:description",
        content: "استكشف الخريطة بأنواعها الثلاثة وابدأ التوجيه المباشر من موقعك.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alhkmystore.lovable.app/maps" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://alhkmystore.lovable.app/maps" }],
  }),
  component: MapsPage,
});

type Pin = {
  key: string;
  title: string;
  subtitle: string;
  price: number | null;
  originalPrice: number | null;
  discount: number | null;
  lat: number;
  lng: number;
  city: string;
  href: string | null;
  hrefLabel: string;
  kind: "store" | "social";
  id: string;
  dealIds: string[];
  offers: Array<{ id: string; title: string; price: number; originalPrice: number; discount: number }>;
};

function normalizedStoreId(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/-official$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type MapStyleId = "map" | "satellite" | "terrain";

/** تعريفات طبقات الخريطة — تُنشأ الطبقات مرة واحدة وتُعاد استخدامها */
const BASE_LAYERS: Record<MapStyleId, { url: string; maxZoom: number; attribution: string }> = {
  map: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    maxZoom: 19,
    attribution: "© Esri",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    maxZoom: 17,
    attribution: "© OpenTopoMap",
  },
};

function MapsPage() {
  const { deal: focusDealId } = Route.useSearch();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<
    "idle" | "loading" | "granted" | "denied" | "unavailable" | "timeout" | "unsupported"
  >("idle");
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("الكل");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [mapStyle, setMapStyle] = useState<MapStyleId>("map");
  const [mapReady, setMapReady] = useState(false);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const markersRef = useRef<Leaflet.Marker[]>([]);
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  const didFocusRef = useRef(false);
  const layersRef = useRef<Partial<Record<MapStyleId, Leaflet.TileLayer>>>({});

  const { data: liveDeals } = useLiveDeals(100);
  const { data: socialOffers } = useSocialOffers(60);
  const branchesQuery = useStoreBranches();

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocStatus("unsupported");
      setUserLocation({ lat: 24.7136, lng: 46.6753 });
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus("granted");
      },
      () => {
        setLocStatus("denied");
        setUserLocation({ lat: 24.7136, lng: 46.6753 });
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** مواقع محفوظة فقط: فروع المتاجر الحقيقية + عروض السوشال ذات الإحداثيات الدقيقة */
  const pins = useMemo<Pin[]>(() => {
    const out: Pin[] = [];
    for (const branch of branchesQuery.data ?? []) {
      const branchStoreId = normalizedStoreId(branch.store_id);
      const offers = (liveDeals ?? []).filter((deal) => {
        const merchantId = normalizedStoreId(deal.merchants.id);
        const merchantSlug = normalizedStoreId(deal.merchants.slug);
        return branchStoreId === merchantId || branchStoreId === merchantSlug;
      });
      if (cityFilter !== "الكل" && branch.city !== cityFilter) continue;
      if (categoryFilter !== "الكل" && !offers.some((deal) => deal.category === categoryFilter)) continue;
      const bestOffer = offers[0];
      const address = [branch.district, branch.address].filter(Boolean).join(" · ");
      out.push({
        key: `store-${branch.id}`,
        id: branch.id,
        kind: "store",
        title: branch.store_name,
        subtitle: [branch.name, address].filter(Boolean).join(" · "),
        price: bestOffer?.price ?? null,
        originalPrice: bestOffer?.original_price ?? null,
        discount: bestOffer
          ? (bestOffer.discount_percent ?? Math.round(((bestOffer.original_price - bestOffer.price) / bestOffer.original_price) * 100))
          : null,
        lat: branch.lat,
        lng: branch.lng,
        city: branch.city,
        href: branch.maps_url,
        hrefLabel: "فتح موقع المتجر",
        dealIds: offers.map((deal) => deal.id),
        offers: offers.map((deal) => ({
          id: deal.id,
          title: deal.title,
          price: deal.price,
          originalPrice: deal.original_price,
          discount:
            deal.discount_percent ?? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100),
        })),
      });
    }
    for (const o of socialOffers ?? []) {
      if (cityFilter !== "الكل" && o.city !== cityFilter) continue;
      if (o.lat == null || o.lng == null) continue;
      if (categoryFilter !== "الكل") continue;
      out.push({
        key: `social-${o.id}`,
        id: o.id,
        kind: "social",
        title: o.title,
        subtitle: `📣 ${o.platform} · @${o.handle}`,
        price: o.price,
        originalPrice: o.original_price,
        discount: o.discount_percent,
        lat: o.lat,
        lng: o.lng,
        city: o.city ?? "",
        href: o.post_url,
        hrefLabel: "فتح المنشور",
        dealIds: [],
        offers: [],
      });
    }
    const q = query.trim().toLowerCase();
    if (!q) return out;
    return out.filter((p) => p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q));
  }, [branchesQuery.data, liveDeals, socialOffers, cityFilter, categoryFilter, query]);

  useEffect(() => {
    if (!focusDealId || selectedPin) return;
    const match = pins.find((pin) => pin.dealIds.includes(focusDealId));
    if (match) setSelectedPin(match.key);
  }, [focusDealId, pins, selectedPin]);

  const categories = useMemo(
    () => ["الكل", ...Array.from(new Set((liveDeals ?? []).map((d) => d.category).filter(Boolean)))],
    [liveDeals],
  );
  const activeFiltersCount = (cityFilter !== "الكل" ? 1 : 0) + (categoryFilter !== "الكل" ? 1 : 0);

  /** إنشاء الخريطة مرة واحدة */
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;
      LRef.current = L;
      const map = L.map(mapRef.current, {
        center: [24.7136, 46.6753],
        zoom: 11,
        minZoom: 5,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;
      setMapReady(true);
      if (typeof ResizeObserver !== "undefined" && mapRef.current) {
        const ro = new ResizeObserver(() => map.invalidateSize());
        ro.observe(mapRef.current);
        resizeObsRef.current = ro;
      }
      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => {
      cancelled = true;
      resizeObsRef.current?.disconnect();
      resizeObsRef.current = null;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    };
  }, []);

  /** تبديل نمط الخريطة — الطبقات تُنشأ مرة واحدة فقط، والبقية تُزال فعليًا */
  useEffect(() => {
    const L = LRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || !mapReady) return;
    (Object.keys(BASE_LAYERS) as MapStyleId[]).forEach((id) => {
      if (!layersRef.current[id]) {
        const def = BASE_LAYERS[id];
        layersRef.current[id] = L.tileLayer(def.url, {
          maxZoom: def.maxZoom,
          attribution: def.attribution,
        });
      }
      const layer = layersRef.current[id]!;
      if (id === mapStyle) {
        if (!map.hasLayer(layer)) layer.addTo(map);
      } else if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
  }, [mapStyle, mapReady]);

  /** رسم الدبابيس */
  useEffect(() => {
    const L = LRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (userLocation) {
      const userIcon = L.divIcon({
        className: "",
        html: `<div style="width:20px;height:20px;background:#D4AF37;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(212,175,55,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup("<b>موقعك الحالي</b>");
    }

    const bounds: [number, number][] = userLocation ? [[userLocation.lat, userLocation.lng]] : [];

    for (const p of pins) {
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;">
             <div style="background:${p.kind === "store" ? "#111" : "#1d1d1f"};color:${p.kind === "store" ? "#D4AF37" : "#fff"};font-size:10px;font-weight:900;font-family:'Tajawal',sans-serif;padding:3px 7px;border-radius:20px;border:2px solid ${p.kind === "store" ? "#D4AF37" : "#7c5cff"};box-shadow:0 2px 10px rgba(0,0,0,0.45);white-space:nowrap;">
               ${p.kind === "store" ? `${escapeHtml(p.title.slice(0, 26))}${p.offers.length ? ` · ${p.offers.length} عرض` : ""}` : `📣 ${escapeHtml(p.subtitle)}`}
            </div>
             <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${p.kind === "store" ? "#111" : "#1d1d1f"};margin-top:-1px;"></div>
          </div>`,
        iconSize: [90, 30],
        iconAnchor: [45, 30],
        popupAnchor: [0, -32],
      });
      const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
      bounds.push([p.lat, p.lng]);
      const priceRow = p.price
        ? `<div style="font-size:13px;font-weight:900;color:#B8860B;">${p.price} ر.س${
            p.originalPrice ? ` <span style="font-size:11px;color:#999;text-decoration:line-through;">${p.originalPrice} ر.س</span>` : ""
          }</div>`
        : "";
      const offerLinks = p.offers
        .slice(0, 4)
        .map((offer) => `<a href="/deals/${encodeURIComponent(offer.id)}" style="display:block;margin-top:6px;color:#111;font-size:11px;font-weight:900;text-decoration:none;">${escapeHtml(offer.title)} · ${offer.price} ر.س</a>`)
        .join("");
      const hrefBtn = p.href
        ? `<a href="${encodeURI(p.href)}" target="_blank" rel="nofollow sponsored noopener noreferrer" style="display:block;text-align:center;margin-top:6px;background:${p.kind === "store" ? "#111" : "#7c5cff"};color:${p.kind === "store" ? "#D4AF37" : "#fff"};font-size:12px;font-weight:900;padding:7px 12px;border-radius:12px;text-decoration:none;">${p.hrefLabel}</a>`
        : "";
      const navBtn = `<a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;margin-top:6px;background:#D4AF37;color:#111;font-size:12px;font-weight:900;padding:7px 12px;border-radius:12px;text-decoration:none;">🧭 ابدأ التوجيه</a>`;
      marker.bindPopup(`
        <div dir="rtl" style="font-family:'Tajawal',sans-serif;min-width:210px;max-width:250px;">
           <div style="font-size:10px;font-weight:900;color:#B8860B;margin-bottom:2px;">${p.kind === "store" ? "📍 موقع متجر موثّق" : "عرض من السوشال ميديا"}</div>
           <div style="font-size:13px;font-weight:900;">${escapeHtml(p.title)}</div>
           <div style="font-size:11px;color:#888;margin:4px 0 6px;">${escapeHtml(p.subtitle)}</div>
          ${priceRow}
           ${offerLinks}
          ${hrefBtn}
          ${navBtn}
        </div>`);
      marker.on("click", () => setSelectedPin(p.key));
      markersRef.current.push(marker);
      if (p.key === selectedPin) {
        map.setView([p.lat, p.lng], 14, { animate: true });
        marker.openPopup();
        didFocusRef.current = true;
      }
    }

    if (!didFocusRef.current && bounds.length > 1) {
      map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 13, duration: 0.6 });
      didFocusRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, userLocation, selectedPin]);

  const selected = pins.find((p) => p.key === selectedPin) ?? null;

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-24 space-y-5">
      <header className="flex items-center gap-3 justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-gold glow-gold flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl md:text-3xl">خريطتي</h1>
            <p className="text-sm text-muted-foreground">عروض التجار والعروض الحصرية على خريطة المملكة</p>
          </div>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          disabled={locStatus === "loading"}
          className="flex items-center gap-2 bg-primary text-secondary px-3 py-2 rounded-2xl text-xs font-black hover:opacity-90 transition press-ripple"
        >
          <Navigation className={`w-4 h-4 ${locStatus === "loading" ? "animate-spin" : ""}`} />
          {locStatus === "loading" ? "جاري تحديد موقعك…" : "استخدم موقعي"}
        </button>
      </header>

      {locStatus === "denied" && (
        <div className="rounded-2xl bg-card border border-destructive/40 p-4 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-muted-foreground">
            إذن الموقع مرفوض — نعرض الخريطة على الرياض. فعّل الإذن من إعدادات المتصفح لعرض الأقرب إليك.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 bg-card border border-primary/20 rounded-2xl px-3 py-2.5">
        <Search className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم العرض أو التاجر…"
          aria-label="بحث داخل الخريطة"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="مسح البحث"
            className="min-h-11 min-w-11 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </button>
        )}
      </div>

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
            <span className="block text-[10px] text-muted-foreground mb-1">النوع</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-secondary/40 border border-primary/20 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-primary"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "الكل" ? "كل الأنواع" : c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {pins.filter((pin) => pin.kind === "store").length} متجر موثّق · {pins.reduce((sum, pin) => sum + pin.offers.length + (pin.kind === "social" ? 1 : 0), 0)} عرض
        </div>
      </section>

      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-[58vh] md:h-[65vh] rounded-3xl overflow-hidden border border-primary/20 shadow-glow"
          style={{ background: "#e8e0d5" }}
          role="application"
          aria-label="خريطة العروض القريبة"
        />
        <div
          role="tablist"
          aria-label="نوع الخريطة"
          className="absolute top-2 left-14 right-2 z-[500] grid grid-cols-3 gap-1 rounded-xl bg-card/95 p-1 shadow-lg text-sm font-bold"
        >
          {(
            [
              ["map", "🗺️ عادية"],
              ["satellite", "🛰️ قمر صناعي"],
              ["terrain", "⛰️ تضاريس"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={mapStyle === id}
              onClick={() => setMapStyle(id)}
              className={`rounded-lg py-2 transition ${
                mapStyle === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {locStatus === "loading" && (
          <div className="absolute top-16 right-2 z-[500] rounded-xl bg-card/95 border border-primary/20 px-3 py-2 text-xs flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" aria-hidden="true" /> جاري تحديد موقعك…
          </div>
        )}
      </div>

      {selected && (
        <section className="rounded-3xl border border-border bg-card p-4 space-y-3">
          <div>
            <h2 className="font-black text-lg">{selected.title}</h2>
            <p className="text-sm text-muted-foreground">{selected.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.offers.map((offer) => (
              <Link
                key={offer.id}
                to="/deals/$id"
                params={{ id: offer.id }}
                onClick={() => trackDealClick({ dealId: offer.id, title: offer.title, storeName: selected.title, surface: "map" })}
                className="h-12 px-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center gap-2"
              >
                {offer.title} · {offer.price} ر.س
              </Link>
            ))}
            {selected.href && (
              <a
                href={selected.href}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="h-12 px-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center gap-2"
              >
                {selected.hrefLabel}
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-4 rounded-2xl bg-secondary/60 border border-primary/20 text-primary font-bold flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" /> ابدأ التوجيه
            </a>
          </div>
        </section>
      )}

      {pins.length > 0 && (
        <section>
          <h2 className="font-black text-lg mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            العروض على الخريطة
          </h2>
          <div className="space-y-3">
            {pins.slice(0, 12).map((p) => {
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                     if (p.kind === "store" && p.offers[0]) {
                      trackDealClick({
                         dealId: p.offers[0].id,
                         title: p.offers[0].title,
                        storeName: p.subtitle,
                        surface: "map",
                      });
                    }
                     setSelectedPin(p.key);
                    const marker = markersRef.current.find(
                      (m) => Math.abs(m.getLatLng().lat - p.lat) < 1e-9 && Math.abs(m.getLatLng().lng - p.lng) < 1e-9,
                    );
                    if (marker && mapInstanceRef.current) {
                      mapInstanceRef.current.setView([p.lat, p.lng], 14, { animate: true });
                      marker.openPopup();
                      mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  className="w-full text-right flex items-center gap-3 bg-card border rounded-2xl p-3 transition-all hover-lift border-border/60"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-sm truncate">{p.title}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{p.subtitle}</span>
                    <span className="block text-[10px] text-primary font-bold mt-0.5">📍 {p.city}</span>
                  </span>
                  <span className="text-left shrink-0">
                    {p.price && (
                      <span className="block text-base font-black text-primary">{p.price} ر.س</span>
                    )}
                    {p.discount != null && p.discount > 0 && (
                      <span className="block text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold mt-1">
                        -{p.discount}%
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {pins.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          لا توجد مواقع متاجر موثّقة بإحداثيات محفوظة حاليًا. ستظهر المتاجر وعروضها هنا فور إضافة مواقعها الحقيقية.
        </p>
      )}
    </main>
  );
}
