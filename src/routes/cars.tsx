import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { carImage, CAR_FILTERS_KEY } from "@/lib/car-images";
import { useQuery } from "@tanstack/react-query";
import {
  Car,
  ExternalLink,
  Fuel,
  Gauge,
  Search,
  Settings2,
  Sparkles,
  MapPin,
  Calendar,
  Armchair,
  PaintBucket,
  Banknote,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type CarListing = {
  id: string;
  title: string;
  brand: string;
  model: string | null;
  year: number;
  city: string;
  price: number;
  original_price: number | null;
  fuel: string;
  transmission: string;
  mileage_km: number;
  body_type: string;
  color: string | null;
  seats: number;
  condition: string;
  dealer: string | null;
  features: string[];
  image_url: string | null;
  link_url: string | null;
};

type SortKey = "price_asc" | "price_desc" | "year_desc" | "discount_desc" | "mileage_asc";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "price_asc", label: "الأقل سعراً" },
  { key: "price_desc", label: "الأعلى سعراً" },
  { key: "year_desc", label: "الأحدث موديلاً" },
  { key: "discount_desc", label: "أكبر خصم" },
  { key: "mileage_asc", label: "الأقل ممشى" },
];

async function fetchCars(): Promise<CarListing[]> {
  const { data, error } = await supabase
    .from("car_listings")
    .select(
      "id,title,brand,model,year,city,price,original_price,fuel,transmission,mileage_km,body_type,color,seats,condition,dealer,features,image_url,link_url",
    )
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CarListing[];
}

export const Route = createFileRoute("/cars")({
  head: () => ({
    meta: [
      { title: "عروض السيارات في السعودية — حكيم AI" },
      {
        name: "description",
        content:
          "عروض سيارات مفصّلة من الوكالات والمعارض السعودية: صور، مواصفات كاملة، نوع الوقود، ناقل الحركة، الممشى، والسعر مع الخصم — مقارنة حية ومحدّثة تلقائياً.",
      },
      { property: "og:title", content: "عروض السيارات في السعودية — حكيم AI" },
      {
        property: "og:description",
        content:
          "قارن عروض السيارات بالمواصفات الكاملة: الماركة، نوع الوقود، الممشى، والسعر بعد الخصم.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CarsPage,
});

function riyal(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toLocaleString("ar-SA")} ر.س`;
}

function Chip({
  active,
  onClick,
  children,
  variant = "primary",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const activeCls =
    variant === "primary"
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-secondary text-secondary-foreground border-secondary";
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active
          ? activeCls
          : "bg-card/60 border-border/70 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <span className="text-primary/70">{icon}</span>
      {value ? value : label}
    </span>
  );
}

function CarsPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [fuel, setFuel] = useState("all");
  const [condition, setCondition] = useState("all");
  const [sort, setSort] = useState<SortKey>("price_asc");
  const [loaded, setLoaded] = useState(false);

  // حفظ الفلاتر للعودة إليها من صفحة التفاصيل
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(CAR_FILTERS_KEY) ?? "{}");
      if (s.q) setQ(s.q);
      if (s.city) setCity(s.city);
      if (s.fuel) setFuel(s.fuel);
      if (s.condition) setCondition(s.condition);
      if (s.sort) setSort(s.sort);
    } catch {
      /* تجاهل */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) sessionStorage.setItem(CAR_FILTERS_KEY, JSON.stringify({ q, city, fuel, condition, sort }));
  }, [loaded, q, city, fuel, condition, sort]);

  const query = useQuery({
    queryKey: ["car-listings-full"],
    queryFn: fetchCars,
    staleTime: 60_000,
  });

  const cars = query.data ?? [];

  const cities = useMemo(() => Array.from(new Set(cars.map((c) => c.city))).sort(), [cars]);
  const fuels = useMemo(() => Array.from(new Set(cars.map((c) => c.fuel))).sort(), [cars]);
  const conditions = useMemo(
    () => Array.from(new Set(cars.map((c) => c.condition))).sort(),
    [cars],
  );

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = cars.filter(
      (c) =>
        (city === "all" || c.city === city) &&
        (fuel === "all" || c.fuel === fuel) &&
        (condition === "all" || c.condition === condition) &&
        (!term ||
          c.title.toLowerCase().includes(term) ||
          c.brand.toLowerCase().includes(term) ||
          (c.model ?? "").toLowerCase().includes(term)),
    );
    const sorted = [...filtered];
    const discountOf = (c: CarListing) =>
      c.original_price && c.original_price > c.price
        ? c.original_price - c.price
        : 0;
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
      case "discount_desc":
        sorted.sort((a, b) => discountOf(b) - discountOf(a));
        break;
      case "mileage_asc":
        sorted.sort((a, b) => a.mileage_km - b.mileage_km);
        break;
    }
    return sorted;
  }, [cars, q, city, fuel, condition, sort]);

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Car className="w-6 h-6 text-primary" /> عروض السيارات
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          عروض مفصّلة من الوكالات والمعارض السعودية — مواصفات كاملة وسعر بعد الخصم، تُحدَّث
          تلقائياً.
        </p>
      </header>

      {/* البحث */}
      <div className="mb-3 relative">
        <Search className="absolute right-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بالماركة أو الموديل…"
          className="pr-9"
        />
      </div>

      {/* الفلاتر */}
      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip active={city === "all"} onClick={() => setCity("all")}>
            كل المدن
          </Chip>
          {cities.map((c) => (
            <Chip key={c} active={city === c} onClick={() => setCity(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip active={fuel === "all"} onClick={() => setFuel("all")}>
            كل أنواع الوقود
          </Chip>
          {fuels.map((f) => (
            <Chip key={f} active={fuel === f} onClick={() => setFuel(f)}>
              {f}
            </Chip>
          ))}
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <Chip active={condition === "all"} onClick={() => setCondition("all")}>
            الكل
          </Chip>
          {conditions.map((c) => (
            <Chip key={c} active={condition === c} onClick={() => setCondition(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SORTS.map((s) => (
            <Chip
              key={s.key}
              active={sort === s.key}
              onClick={() => setSort(s.key)}
              variant="secondary"
            >
              {s.label}
            </Chip>
          ))}
          <span className="ms-auto text-xs text-muted-foreground">
            {rows.length} سيارة
          </span>
        </div>
      </div>

      {/* البطاقات */}
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          لا توجد سيارات مطابقة — جرّب توسيع الفلاتر أو ابحث بماركة أخرى.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((car) => {
            const discount =
              car.original_price && car.original_price > car.price
                ? car.original_price - car.price
                : 0;
            const discountPct =
              discount > 0 && car.original_price
                ? Math.round((discount / car.original_price) * 100)
                : 0;
            const inner = (
              <article className="group flex flex-col rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
                {/* الصورة */}
                <div className="relative h-40 bg-muted/40 grid place-items-center overflow-hidden">
                  <img
                    src={carImage(car).src}
                    alt={car.title}
                    loading="lazy"
                    width={1024}
                    height={640}
                    className="w-full h-full object-cover transition group-hover:scale-105"
                  />
                  {car.mileage_km === 0 && (
                    <span className="absolute bottom-2 start-2 rounded-full bg-primary text-primary-foreground text-[11px] font-bold px-2 py-0.5">
                      جديدة
                    </span>
                  )}
                  {discountPct > 0 && (
                    <span className="absolute top-2 start-2 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5">
                      -{discountPct}%
                    </span>
                  )}
                  <span className="absolute top-2 end-2 rounded-full bg-card/85 border border-border/60 text-[11px] font-medium px-2 py-0.5">
                    {car.condition}
                  </span>
                </div>

                {/* التفاصيل */}
                <div className="flex flex-col flex-1 gap-2.5 p-4">
                  <div>
                    <h3 className="font-bold leading-snug">{car.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {car.brand}
                      {car.model ? ` • ${car.model}` : ""}
                    </p>
                  </div>

                  {/* المواصفات الأساسية */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                    <SpecItem icon={<Calendar className="w-3.5 h-3.5" />} label="الموديل" value={String(car.year)} />
                    <SpecItem icon={<Fuel className="w-3.5 h-3.5" />} label="الوقود" value={car.fuel} />
                    <SpecItem icon={<Settings2 className="w-3.5 h-3.5" />} label="ناقل الحركة" value={car.transmission} />
                    {car.mileage_km > 0 && (
                      <SpecItem
                        icon={<Gauge className="w-3.5 h-3.5" />}
                        label="الممشى"
                        value={`${car.mileage_km.toLocaleString("ar-SA")} كم`}
                      />
                    )}
                  </div>

                  {/* تفاصيل إضافية */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                    <SpecItem icon={<Car className="w-3.5 h-3.5" />} label="النوع" value={car.body_type} />
                    {car.color && (
                      <SpecItem icon={<PaintBucket className="w-3.5 h-3.5" />} label="اللون" value={car.color} />
                    )}
                    <SpecItem icon={<Armchair className="w-3.5 h-3.5" />} label="المقاعد" value={`${car.seats} مقاعد`} />
                  </div>

                  {/* المميزات */}
                  {car.features?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {car.features.slice(0, 4).map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[11px] px-2 py-0.5"
                        >
                          <Sparkles className="w-3 h-3" /> {f}
                        </span>
                      ))}
                      {car.features.length > 4 && (
                        <Badge variant="secondary" className="text-[11px]">
                          +{car.features.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* السعر */}
                  <div className="mt-auto space-y-1 pt-1 border-t border-border/60">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-primary">{riyal(car.price)}</span>
                      {car.original_price && car.original_price > car.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {riyal(car.original_price)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-foreground">
                      القسط من {riyal(monthlyInstallment(car.price))} / شهريًا
                    </p>
                    {discount > 0 && (
                      <p className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                        <Banknote className="w-3.5 h-3.5" /> توفّر {riyal(discount)}
                      </p>
                    )}
                    <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {car.city}
                      {car.dealer ? ` — ${car.dealer}` : ""}
                    </p>
                  </div>
                </div>
              </article>
            );

            return (
              <Link key={car.id} to="/cars/$id" params={{ id: car.id }}>
                {inner}
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-6 mb-24 text-center text-xs text-muted-foreground inline-flex items-center gap-1 w-full justify-center">
        اضغط أي سيارة لعرض تفاصيلها ومواصفاتها الكاملة <ExternalLink className="w-3 h-3" />
      </p>
    </div>
  );
}
