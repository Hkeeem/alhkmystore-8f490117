import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Car, Gauge, MapPin, Fuel, Settings2, ArrowLeft } from "lucide-react";
import { fetchCars, formatSar, type CarFilters, type CarListing } from "@/lib/cars";

export const Route = createFileRoute("/cars")({
  head: () => ({
    meta: [
      { title: "عروض السيارات في السعودية — حكيم AI" },
      {
        name: "description",
        content:
          "تصفّح عروض السيارات الجديدة والمستعملة في مدن المملكة، وفلترها حسب السعر والمواصفات والمدينة.",
      },
      { property: "og:title", content: "عروض السيارات في السعودية — حكيم AI" },
      {
        property: "og:description",
        content: "سيارات بأفضل الأسعار مع فلترة المدينة والمواصفات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CarsPage,
});

const ANY = "الكل";

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function CarsPage() {
  const [all, setAll] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(ANY);
  const [brand, setBrand] = useState(ANY);
  const [bodyType, setBodyType] = useState(ANY);
  const [transmission, setTransmission] = useState(ANY);
  const [fuel, setFuel] = useState(ANY);
  const [maxPrice, setMaxPrice] = useState(400000);
  const [sort, setSort] = useState<NonNullable<CarFilters["sort"]>>("price-asc");

  useEffect(() => {
    let alive = true;
    fetchCars({}, 200).then((rows) => {
      if (!alive) return;
      setAll(rows);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const opts = useMemo(() => {
    const uniq = (xs: string[]) => [ANY, ...Array.from(new Set(xs)).sort()];
    return {
      cities: uniq(all.map((c) => c.city)),
      brands: uniq(all.map((c) => c.brand)),
      bodies: uniq(all.map((c) => c.bodyType)),
      transmissions: uniq(all.map((c) => c.transmission)),
      fuels: uniq(all.map((c) => c.fuel)),
    };
  }, [all]);

  const list = useMemo(() => {
    const filtered = all.filter(
      (c) =>
        (city === ANY || c.city === city) &&
        (brand === ANY || c.brand === brand) &&
        (bodyType === ANY || c.bodyType === bodyType) &&
        (transmission === ANY || c.transmission === transmission) &&
        (fuel === ANY || c.fuel === fuel) &&
        c.price <= maxPrice,
    );
    const sorted = [...filtered];
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "newest") sorted.sort((a, b) => b.year - a.year);
    else sorted.sort((a, b) => a.price - b.price);
    return sorted;
  }, [all, city, brand, bodyType, transmission, fuel, maxPrice, sort]);

  return (
    <div className="container py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-black text-foreground">
          <Car className="h-6 w-6 text-primary" /> عروض السيارات
        </h1>
        <p className="text-sm text-muted-foreground">
          جدول تلقائي يجلب السيارات المتاحة حسب السعر والمواصفات مع فلتر المدينة.
        </p>
      </header>

      <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Select label="المدينة" value={city} options={opts.cities} onChange={setCity} />
          <Select label="الماركة" value={brand} options={opts.brands} onChange={setBrand} />
          <Select label="نوع الهيكل" value={bodyType} options={opts.bodies} onChange={setBodyType} />
          <Select
            label="ناقل الحركة"
            value={transmission}
            options={opts.transmissions}
            onChange={setTransmission}
          />
          <Select label="الوقود" value={fuel} options={opts.fuels} onChange={setFuel} />
          <Select
            label="الترتيب"
            value={sort}
            options={["price-asc", "price-desc", "newest"]}
            onChange={(v) => setSort(v as NonNullable<CarFilters["sort"]>)}
          />
        </div>
        <div className="mt-4">
          <label className="text-xs font-bold text-muted-foreground">
            أعلى سعر: {formatSar(maxPrice)}
          </label>
          <input
            type="range"
            min={50000}
            max={400000}
            step={5000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-primary)]"
          />
        </div>
      </section>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">جارِ تحميل السيارات…</p>
      ) : list.length === 0 ? (
        <p className="rounded-3xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          لا توجد سيارات مطابقة للفلاتر الحالية.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Link
              key={c.id}
              to="/cars/$id"
              params={{ id: c.id }}
              className="group rounded-3xl border border-border/60 bg-card p-4 shadow-card transition hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-black text-foreground">{c.title}</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  {c.condition}
                </span>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {c.city}
                </span>
                <span className="flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" /> {c.mileageKm.toLocaleString("ar-SA")} كم
                </span>
                <span className="flex items-center gap-1">
                  <Fuel className="h-3.5 w-3.5" /> {c.fuel}
                </span>
                <span className="flex items-center gap-1">
                  <Settings2 className="h-3.5 w-3.5" /> {c.transmission}
                </span>
              </p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <span className="text-lg font-black text-primary">{formatSar(c.price)}</span>
                  {c.originalPrice && c.originalPrice > c.price && (
                    <span className="mr-2 text-xs text-muted-foreground line-through">
                      {formatSar(c.originalPrice)}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-primary">
                  التفاصيل <ArrowLeft className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
