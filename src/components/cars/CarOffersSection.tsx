import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Car, MapPin, Fuel, Gauge, Calendar, ArrowLeft } from "lucide-react";

type CarRow = {
  id: string;
  title: string;
  brand: string;
  year: number;
  city: string;
  price: number;
  original_price: number | null;
  mileage_km: number;
  fuel: string;
  transmission: string;
  condition: string;
  image_url: string | null;
  link_url: string | null;
};

type SortKey = "price_asc" | "price_desc" | "year_desc" | "mileage_asc";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "price_asc", label: "الأقل سعراً" },
  { key: "price_desc", label: "الأعلى سعراً" },
  { key: "year_desc", label: "الأحدث موديلاً" },
  { key: "mileage_asc", label: "الأقل ممشى" },
];

const fmt = (n: number) => n.toLocaleString("ar-SA");

export function CarOffersSection() {
  const [city, setCity] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("price_asc");

  const query = useQuery({
    queryKey: ["car-offers-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_listings")
        .select(
          "id,title,brand,year,city,price,original_price,mileage_km,fuel,transmission,condition,image_url,link_url",
        )
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as CarRow[];
    },
    staleTime: 60_000,
  });

  const cars = query.data ?? [];

  const cities = useMemo(
    () => Array.from(new Set(cars.map((c) => c.city))).sort(),
    [cars],
  );

  const visible = useMemo(() => {
    const filtered = city === "all" ? cars : cars.filter((c) => c.city === city);
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
    return sorted.slice(0, 8);
  }, [cars, city, sort]);

  if (!query.isLoading && cars.length === 0) return null;

  return (
    <section dir="rtl" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/15 text-primary">
            <Car className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold">عروض السيارات</h2>
            <p className="text-xs text-muted-foreground">
              سيارات محدّثة تلقائياً — قارن بالسعر والمواصفات
            </p>
          </div>
        </div>
        <Link
          to="/cars"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          عرض الكل <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCity("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            city === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card/60 border-border/70 text-muted-foreground hover:text-foreground"
          }`}
        >
          كل المدن
        </button>
        {cities.map((c) => (
          <button
            key={c}
            onClick={() => setCity(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              city === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/60 border-border/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
        <div className="ms-auto flex items-center gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                sort === s.key
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-card/60 border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* البطاقات */}
      {query.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {visible.map((car) => {
            const discount =
              car.original_price && car.original_price > car.price
                ? Math.round(((car.original_price - car.price) / car.original_price) * 100)
                : 0;
            const inner = (
              <article className="group rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-28 md:h-32 bg-muted/40 grid place-items-center overflow-hidden">
                  {car.image_url ? (
                    <img
                      src={car.image_url}
                      alt={car.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <Car className="w-10 h-10 text-muted-foreground/40" />
                  )}
                  {discount > 0 && (
                    <span className="absolute top-2 start-2 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5">
                      -{discount}%
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="text-sm font-semibold leading-snug line-clamp-1">
                    {car.title}
                  </h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {car.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {car.year}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Gauge className="w-3 h-3" /> {fmt(car.mileage_km)} كم
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Fuel className="w-3 h-3" /> {car.fuel}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-primary">
                      {fmt(car.price)} ر.س
                    </span>
                    {car.original_price && car.original_price > car.price && (
                      <span className="text-[11px] text-muted-foreground line-through">
                        {fmt(car.original_price)}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
            return car.link_url ? (
              <a key={car.id} href={car.link_url} target="_blank" rel="noreferrer">
                {inner}
              </a>
            ) : (
              <div key={car.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </section>
  );
}
