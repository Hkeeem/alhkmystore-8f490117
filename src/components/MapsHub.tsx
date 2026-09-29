import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Compass, Layers, MapPin, Clock, Phone, Copy, Navigation, Search, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { BranchPinsMap } from "@/components/BranchPinsMap";
import { stores } from "@/data/deals";
import { fetchRealBranches, telHref, type RealBranch } from "@/lib/real-branches";

type Provider = "google" | "apple" | "balady";
type View = "map" | "satellite" | "terrain";

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function MapsHub() {
  const { data, isLoading } = useQuery({ queryKey: ["real-branches"], queryFn: fetchRealBranches });
  const branches = data ?? [];
  const [provider, setProvider] = useState<Provider>("google");
  const [view, setView] = useState<View>("map");
  const [city, setCity] = useState("الكل");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<RealBranch | null>(null);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);

  const locate = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => toast.error("تعذّر تحديد موقعك"),
    );
  useEffect(() => { locate(); }, []);

  const cities = useMemo(() => ["الكل", ...new Set(branches.map((b) => b.city))], [branches]);
  const storeCounts = useMemo(() => {
    const m = new Map<string, number>();
    branches.forEach((b) => m.set(b.store_id, (m.get(b.store_id) ?? 0) + 1));
    return m;
  }, [branches]);

  const list = useMemo(() => {
    const t = q.trim();
    return branches
      .filter((b) => (city === "الكل" || b.city === city) && (!storeId || b.store_id === storeId))
      .filter((b) => !t || [b.name, b.district, b.address].some((v) => v?.includes(t)))
      .map((b) => ({ b, d: me ? km(me, b) : null }))
      .sort((x, y) => (x.d ?? 0) - (y.d ?? 0));
  }, [branches, city, storeId, q, me]);

  useEffect(() => {
    if (!selected || !list.some((x) => x.b.id === selected.id)) setSelected(list[0]?.b ?? null);
  }, [list, selected]);

  const navUrl = (b: RealBranch) =>
    provider === "apple"
      ? `https://maps.apple.com/?daddr=${b.lat},${b.lng}`
      : provider === "balady" && b.balady_url
        ? b.balady_url
        : b.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`;
  const selDist = selected && me ? km(me, selected) : null;

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-4">
        <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/25 via-card to-card p-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs text-primary">
            <Compass className="w-4 h-4" /> الخريطة الموحدة لفروع المملكة 🇸🇦
          </span>
          <h1 className="mt-3 text-2xl font-black">خرائط Google والفروع المباشرة</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            استكشف فروع المتاجر في {city === "الكل" ? "المملكة" : <b className="text-accent">{city}</b>} مع خرائط تفاعلية وتوجيه مباشر.
          </p>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-4 w-full h-12 rounded-2xl border border-border bg-background/60 px-4 text-sm"
          >
            {cities.map((c) => <option key={c} value={c}>📍 {c}</option>)}
          </select>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 font-bold mb-3"><Layers className="w-5 h-5 text-primary" /> مزوّد الخريطة:</p>
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
            {([["google", "خرائط Google"], ["apple", "خرائط Apple"], ["balady", "بلدي"]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setProvider(id)}
                className={`rounded-xl py-3 text-sm font-bold transition ${provider === id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <div className="flex justify-between mb-3">
            <p className="font-bold">اختر المتجر للمعاينة:</p>
            <span className="text-xs text-muted-foreground">{storeCounts.size} متجر متاح</span>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2">
            <button
              onClick={() => setStoreId(null)}
              className={`w-full rounded-2xl border p-3 text-right ${!storeId ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <span className="font-bold">كل المتاجر</span>
              <span className="float-left text-xs text-muted-foreground">{branches.length} فرع</span>
            </button>
            {stores.filter((s) => storeCounts.has(s.id)).map((s) => (
              <button
                key={s.id}
                onClick={() => setStoreId(s.id)}
                className={`w-full rounded-2xl border p-3 text-right flex items-center gap-3 ${storeId === s.id ? "border-primary bg-primary/10" : "border-border"}`}
              >
                {s.logoUrl ? <img src={s.logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-background" /> : <span className="text-xl">{s.logo}</span>}
                <span className="font-bold flex-1">{s.name}</span>
                <span className="text-xs text-muted-foreground">{storeCounts.get(s.id)} فرع</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> الفروع{city !== "الكل" ? ` في ${city}` : ""}:</p>
            <span className="rounded-full bg-primary/15 text-primary text-xs px-3 py-1">{list.length} فروع</span>
          </div>
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالحي أو الشارع…"
              className="w-full h-11 rounded-2xl border border-border bg-background pr-9 pl-3 text-sm outline-none focus:border-primary" />
          </div>
          {isLoading && <p className="text-sm text-muted-foreground">جارِ تحميل الفروع…</p>}
          {!isLoading && list.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد فروع مضافة هنا بعد. تُضاف الفروع الحقيقية من لوحة التحكم.</p>
          )}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {list.map(({ b, d }) => (
              <button key={b.id} onClick={() => setSelected(b)}
                className={`w-full rounded-2xl border p-3 text-right space-y-1 ${selected?.id === b.id ? "border-primary bg-primary/10" : "border-border"}`}>
                <div className="flex justify-between gap-2">
                  <span className="font-bold">{b.name}</span>
                  {d != null && <span className="text-xs rounded-full bg-primary/15 text-primary px-2 py-0.5 shrink-0">{d.toFixed(1)} كم</span>}
                </div>
                {(b.district || b.address) && <p className="text-xs text-muted-foreground">{[b.district, b.address].filter(Boolean).join(" - ")}</p>}
                {b.hours && <p className="text-xs text-primary flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.hours}</p>}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card overflow-hidden">
          <div className="relative">
            <BranchPinsMap branches={list.map((x) => x.b)} style={view} selectedId={selected?.id} me={me} />
            <div role="tablist" aria-label="نوع الخريطة" className="absolute top-2 left-14 right-2 z-[500] grid grid-cols-3 gap-1 rounded-xl bg-card/95 p-1 shadow-lg text-sm font-bold">
              {([["map", "🗺️ عادية"], ["satellite", "🛰️ قمر صناعي"], ["terrain", "⛰️ تضاريس"]] as const).map(([id, label]) => (
                <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
                  className={`rounded-lg py-2 transition ${view === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{label}</button>
              ))}
            </div>
            <button onClick={locate} className="absolute bottom-3 left-3 z-[500] rounded-full bg-card p-2 shadow" aria-label="موقعي">
              <Crosshair className="w-5 h-5 text-primary" />
            </button>
          </div>
          {selected && (
            <div className="p-4 space-y-3">
              <div>
                <h2 className="font-black text-lg">{selected.name}</h2>
                <p className="text-sm text-muted-foreground">{[selected.city, selected.address].filter(Boolean).join(" • ")}</p>
                {selected.hours && <p className="text-sm text-primary mt-1">🕒 {selected.hours}</p>}
                {selDist != null && <p className="text-sm mt-1">🚗 المسافة التقديرية: {selDist.toFixed(1)} كم</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(`${selected.name}\n${selected.lat},${selected.lng}`); toast.success("تم النسخ"); }}
                  className="h-11 rounded-2xl border border-border text-sm flex items-center justify-center gap-2">
                  <Copy className="w-4 h-4" /> نسخ الموقع والإحداثيات
                </button>
                {selected.phone ? (
                  <a href={telHref(selected.phone)} className="h-11 rounded-2xl border border-border text-sm flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> اتصال بالفرع
                  </a>
                ) : (
                  <Link to="/branches/$id" params={{ id: selected.id }} className="h-11 rounded-2xl border border-border text-sm grid place-items-center">
                    التفاصيل الكاملة
                  </Link>
                )}
              </div>
              <a href={navUrl(selected)} target="_blank" rel="noopener noreferrer"
                className="h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
                <Navigation className="w-4 h-4" /> بدء الملاحة في {provider === "apple" ? "خرائط Apple" : provider === "balady" && selected.balady_url ? "بلدي" : "Google Maps"}
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
