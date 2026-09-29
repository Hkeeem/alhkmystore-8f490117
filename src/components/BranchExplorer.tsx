import { useMemo, useState } from "react";
import { Compass, Layers, MapPin, Search, Clock, Phone, Copy, Navigation, Truck } from "lucide-react";
import { toast } from "sonner";
import { stores } from "@/data/deals";
import { branches, CITIES, distanceKm } from "@/data/store-branches";

type Provider = "google" | "apple" | "balady";

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "google", label: "خرائط Google" },
  { id: "apple", label: "خرائط Apple" },
  { id: "balady", label: "المستكشف البلدي (بلدي)" },
];

const HOURS = ["06:00 ص - 01:00 ص (يومياً)", "24 ساعة (طوال أيام الأسبوع)", "07:00 ص - 12:00 م"];

function hash(t: string) {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 100000;
  return h;
}

function navUrl(p: Provider, lat: number, lng: number) {
  if (p === "apple") return `https://maps.apple.com/?daddr=${lat},${lng}`;
  if (p === "balady") return `https://balady.gov.sa/ar/services/explorer?lat=${lat}&lng=${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function BranchExplorer() {
  const [cityName, setCityName] = useState(CITIES[0].name);
  const [provider, setProvider] = useState<Provider>("google");
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [branchId, setBranchId] = useState<string | null>(null);

  const city = CITIES.find((c) => c.name === cityName)!;
  const store = stores.find((s) => s.id === storeId);

  const storeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of branches) if (b.city === cityName) m.set(b.storeId, (m.get(b.storeId) ?? 0) + 1);
    return m;
  }, [cityName]);

  const list = useMemo(
    () =>
      branches
        .filter((b) => b.storeId === storeId && b.city === cityName && b.name.includes(q.trim()))
        .map((b) => ({ ...b, km: distanceKm(city.lat, city.lng, b.lat, b.lng), h: hash(b.id) }))
        .sort((a, b) => a.km - b.km),
    [storeId, cityName, q, city],
  );

  const selected = list.find((b) => b.id === branchId) ?? list[0];
  const center = selected ?? city;

  const copy = async () => {
    if (!selected) return;
    await navigator.clipboard?.writeText(`${selected.name} — ${selected.lat},${selected.lng}`);
    toast.success("تم نسخ الموقع والإحداثيات");
  };

  return (
    <section dir="rtl" className="space-y-4">
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/25 via-card to-card p-5 space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs font-bold">
          <Compass className="w-3.5 h-3.5" /> الخريطة الموحدة لفروع المملكة العربية السعودية
        </span>
        <h2 className="font-display font-black text-2xl">خرائط Google والفروع المباشرة</h2>
        <p className="text-sm text-muted-foreground">
          استكشف فروع السوبرماركت ومتاجر التجزئة في <b className="text-primary">{cityName}</b> مع خريطة تفاعلية
          ومسافات تقديرية.
        </p>
        <label className="flex items-center gap-2 rounded-2xl border border-border bg-background/40 px-3 py-2 max-w-xs">
          <MapPin className="w-4 h-4 text-destructive" />
          <select
            value={cityName}
            onChange={(e) => {
              setCityName(e.target.value);
              setBranchId(null);
            }}
            className="flex-1 bg-transparent font-bold text-sm outline-none"
            aria-label="اختر المدينة"
          >
            {CITIES.map((c) => (
              <option key={c.name} value={c.name} className="bg-background">
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
        <p className="flex items-center gap-2 font-bold text-sm">
          <Layers className="w-4 h-4 text-primary" /> مزود الخريطة:
        </p>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/50 p-1">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={`rounded-xl px-2 py-2.5 text-xs font-bold transition ${
                provider === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm">اختر المتجر للمعاينة:</p>
          <span className="text-xs text-muted-foreground">{storeCounts.size} متجر متاح</span>
        </div>
        <div className="max-h-80 overflow-y-auto space-y-2 pe-1">
          {stores
            .filter((s) => storeCounts.has(s.id))
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setStoreId(s.id);
                  setBranchId(null);
                }}
                className={`w-full flex items-center justify-between gap-3 rounded-2xl border p-3 text-start transition ${
                  s.id === storeId ? "border-primary bg-primary/10" : "border-border bg-background/30"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt="" className="w-10 h-10 rounded-xl object-contain bg-background p-1" loading="lazy" />
                  ) : (
                    <span className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-black">{s.logo}</span>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{s.name}</p>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Truck className="w-3 h-3" /> {s.category}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{storeCounts.get(s.id)} فرع</span>
              </button>
            ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-bold text-sm">
            <MapPin className="w-4 h-4 text-primary" /> فروع {store?.name} في {cityName}:
          </p>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">{list.length} فروع</span>
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-border bg-background/40 px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالحي أو الشارع..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <div className="space-y-2">
          {list.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBranchId(b.id)}
              className={`w-full rounded-2xl border p-3 text-start space-y-1 ${
                selected?.id === b.id ? "border-primary bg-primary/10" : "border-border bg-background/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-sm">{b.name}</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold shrink-0">{b.km.toFixed(1)} كم</span>
              </div>
              <p className="flex items-center gap-1 text-xs text-primary">
                <Clock className="w-3 h-3" /> {HOURS[b.h % HOURS.length]}
              </p>
            </button>
          ))}
          {list.length === 0 && <p className="text-sm text-muted-foreground">لا توجد فروع مطابقة.</p>}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <iframe
          title="خريطة الفرع"
          src={`https://maps.google.com/maps?q=${center.lat},${center.lng}&z=15&hl=ar&output=embed`}
          className="w-full h-72 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {selected && (
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black">{selected.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cityName} • {HOURS[selected.h % HOURS.length]}
                </p>
              </div>
              <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] font-bold text-primary shrink-0">
                مفتوح للزيارة والتسوق
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={copy} className="flex items-center justify-center gap-2 rounded-2xl border border-border py-2.5 text-xs font-bold">
                <Copy className="w-4 h-4" /> نسخ الموقع والإحداثيات
              </button>
              <a href="tel:920000000" className="flex items-center justify-center gap-2 rounded-2xl border border-border py-2.5 text-xs font-bold">
                <Phone className="w-4 h-4" /> اتصال بالفرع
              </a>
            </div>
            <a
              href={navUrl(provider, selected.lat, selected.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-black text-primary-foreground"
            >
              <Navigation className="w-4 h-4" /> بدء الملاحة المباشرة في {PROVIDERS.find((p) => p.id === provider)?.label}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
