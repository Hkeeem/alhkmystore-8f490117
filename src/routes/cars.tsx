import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Car,
  MapPin,
  Fuel,
  Gauge,
  Calendar,
  Search,
  X,
  Users,
  Palette,
  Settings2,
  Phone,
  ExternalLink,
  BadgeCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type CarRow = {
  id: string;
  title: string;
  brand: string;
  model: string | null;
  year: number;
  city: string;
  price: number;
  original_price: number | null;
  mileage_km: number;
  fuel: string;
  transmission: string;
  body_type: string;
  condition: string;
  seats: number;
  color: string | null;
  dealer: string | null;
  phone: string | null;
  image_url: string | null;
  link_url: string | null;
  features: string[];
};

type SortKey = "price_asc" | "price_desc" | "year_desc" | "mileage_asc";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "price_asc", label: "الأقل سعراً" },
  { key: "price_desc", label: "الأعلى سعراً" },
  { key: "year_desc", label: "الأحدث موديلاً" },
  { key: "mileage_asc", label: "الأقل ممشى" },
];

const fmt = (n: number) => n.toLocaleString("ar-SA");

async function fetchCars(): Promise<CarRow[]> {
  const { data, error } = await supabase
    .from("car_listings")
    .select(
      "id,title,brand,model,year,city,price,original_price,mileage_km,fuel,transmission,body_type,condition,seats,color,dealer,phone,image_url,link_url,features",
    )
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as CarRow[];
}

export const Route = createFileRoute("/cars")({
  head: () => ({
    meta: [
      { title: "عروض السيارات في السعودية — حكيم AI" },
      {
        name: "description",
        content:
          "عروض سيارات مفصلة: صور، مواصفات، ماركة، نوع الوقود والسعر — مرتبة حسب السعر والمواصفات مع فلتر المدينة.",
      },
      { property: "og:title", content: "عروض السيارات في السعودية — حكيم AI" },
      {
        property: "og:description",
        content: "قارن عروض السيارات بالصور والمواصفات والأسعار في مكان واحد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CarsPage,
});

function discountOf(car: CarRow) {
  return car.original_price && car.original_price > car.price
    ? Math.round(((car.original_price - car.price) / car.original_price) * 100)
    : 0;
}

function SpecChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      {icon} {label}
    </span>
  );
}

function CarDetailsDialog({ car, onClose }: { car: CarRow; onClose: () => void }) {
  const discount = discountOf(car);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={car.title}
    >
      <div
        dir="rtl"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border/70 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 bg-muted/40 grid place-items-center overflow-hidden">
          {car.image_url ? (
            <img src={car.image_url} alt={car.title} className="w-full h-full object-cover" />
          ) : (
            <Car className="w-16 h-16 text-muted-foreground/40" />
          )}
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="absolute top-3 start-3 grid place-items-center w-9 h-9 rounded-full bg-background/80 backdrop-blur border border-border/70 hover:bg-background"
          >
            <X className="w-4 h-4" />
          </button>
          {discount > 0 && (
            <span className="absolute top-3 end-3 rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1">
              خصم {discount}%
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-black">{car.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {car.brand}
              {car.model ? ` ${car.model}` : ""} • {car.year} • {car.condition}
            </p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-primary">{fmt(car.price)} ر.س</span>
            {car.original_price && car.original_price > car.price && (
              <span className="text-sm text-muted-foreground line-through">
                {fmt(car.original_price)} ر.س
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { icon: <MapPin className="w-4 h-4 text-primary" />, label: "المدينة", value: car.city },
              { icon: <Fuel className="w-4 h-4 text-primary" />, label: "الوقود", value: car.fuel },
              { icon: <Gauge className="w-4 h-4 text-primary" />, label: "الممشى", value: `${fmt(car.mileage_km)} كم` },
              { icon: <Settings2 className="w-4 h-4 text-primary" />, label: "القير", value: car.transmission },
              { icon: <Car className="w-4 h-4 text-primary" />, label: "الهيكل", value: car.body_type },
              { icon: <Users className="w-4 h-4 text-primary" />, label: "المقاعد", value: String(car.seats) },
              ...(car.color
                ? [{ icon: <Palette className="w-4 h-4 text-primary" />, label: "اللون", value: car.color }]
                : []),
              ...(car.dealer
                ? [{ icon: <BadgeCheck className="w-4 h-4 text-primary" />, label: "المعرض", value: car.dealer }]
                : []),
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                {s.icon}
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className="truncate text-xs font-semibold">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {car.features.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold text-muted-foreground">المواصفات</p>
              <div className="flex flex-wrap gap-1.5">
                {car.features.map((f) => (
                  <Badge key={f} variant="secondary" className="text-[11px]">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {car.phone && (
              <Button asChild className="flex-1">
                <a href={`tel:${car.phone}`}>
                  <Phone className="w-4 h-4" /> اتصال بالبائع
                </a>
              </Button>
            )}
            {car.link_url && (
              <Button asChild variant="outline" className="flex-1">
                <a href={car.link_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" /> صفحة العرض
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CarsPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [fuel, setFuel] = useState("all");
  const [sort, setSort] = useState<SortKey>("price_asc");
  const [selected, setSelected] = useState<CarRow | null>(null);

  const query = useQuery({ queryKey: ["cars-page"], queryFn: fetchCars, staleTime: 60_000 });
  const cars = query.data ?? [];

  const cities = useMemo(() => Array.from(new Set(cars.map((c) => c.city))).sort(), [cars]);
  const fuels = useMemo(() => Array.from(new Set(cars.map((c) => c.fuel))).sort(), [cars]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = cars.filter(
      (c) =>
        (city === "all" || c.city === city) &&
        (fuel === "all" || c.fuel === fuel) &&
        (!term ||
          c.title.toLowerCase().includes(term) ||
          c.brand.toLowerCase().includes(term) ||
          (c.model ?? "").toLowerCase().includes(term)),
    );
    const sorted = [...filtered];
    switch (sort) {
      case "price_asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "year_desc":
        sorted.sort((a, b) => b.year - a.year);
        break;
      case "mileage_asc":
        sorted.sort((a, b) => a.mileage_km - b.mileage_km);
        break;
    }
    return sorted;
  }, [cars, q, city, fuel, sort]);

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Car className="w-6 h-6 text-primary" /> عروض السيارات
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          عروض مفصلة بالصور والمواصفات والأسعار — تُحدَّث تلقائياً من المعارض والوكالات.
        </p>
      </header>

      {/* البحث والفلاتر */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالماركة أو الموديل"
            className="pr-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill active={city === "all"} onClick={() => setCity("all")} label="كل المدن" />
          {cities.map((c) => (
            <FilterPill key={c} active={city === c} onClick={() => setCity(c)} label={c} />
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          <FilterPill active={fuel === "all"} onClick={() => setFuel("all")} label="كل الوقود" />
          {fuels.map((f) => (
            <FilterPill key={f} active={fuel === f} onClick={() => setFuel(f)} label={f} />
          ))}
          <div className="ms-auto flex items-center gap-1.5">
            {SORTS.map((s) => (
              <FilterPill
                key={s.key}
                active={sort === s.key}
                onClick={() => setSort(s.key)}
                label={s.label}
                secondary
              />
            ))}
          </div>
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          لا توجد عروض سيارات مطابقة حالياً — جرّب تعديل الفلاتر.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((car) => {
            const discount = discountOf(car);
            return (
              <button
                key={car.id}
                onClick={() => setSelected(car)}
                className="group text-right rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md overflow-hidden transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative h-44 bg-muted/40 grid place-items-center overflow-hidden">
                  {car.image_url ? (
                    <img
                      src={car.image_url}
                      alt={car.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <Car className="w-12 h-12 text-muted-foreground/40" />
                  )}
                  {discount > 0 && (
                    <span className="absolute top-2 start-2 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5">
                      -{discount}%
                    </span>
                  )}
                  <span className="absolute bottom-2 end-2 rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-[11px] font-semibold">
                    {car.brand}
                  </span>
                </div>
                <div className="p-3.5 space-y-2.5">
                  <h3 className="text-sm font-bold leading-snug line-clamp-1">{car.title}</h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <SpecChip icon={<MapPin className="w-3 h-3" />} label={car.city} />
                    <SpecChip icon={<Calendar className="w-3 h-3" />} label={String(car.year)} />
                    <SpecChip icon={<Gauge className="w-3 h-3" />} label={`${fmt(car.mileage_km)} كم`} />
                    <SpecChip icon={<Fuel className="w-3 h-3" />} label={car.fuel} />
                    <SpecChip icon={<Settings2 className="w-3 h-3" />} label={car.transmission} />
                  </div>
                  <div className="flex items-baseline gap-2 pt-1 border-t border-border/50">
                    <span className="text-lg font-black text-primary">{fmt(car.price)} ر.س</span>
                    {car.original_price && car.original_price > car.price && (
                      <span className="text-[11px] text-muted-foreground line-through">
                        {fmt(car.original_price)}
                      </span>
                    )}
                    <span className="ms-auto text-[11px] text-primary font-medium">التفاصيل ←</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && <CarDetailsDialog car={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  secondary,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  secondary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active
          ? secondary
            ? "bg-secondary text-secondary-foreground border-secondary"
            : "bg-primary text-primary-foreground border-primary"
          : "bg-card/60 border-border/70 text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
