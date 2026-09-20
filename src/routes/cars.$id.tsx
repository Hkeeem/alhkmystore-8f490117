import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Car, Fuel, Gauge, MapPin, Settings2, Users } from "lucide-react";
import { fetchCarById, formatSar, type CarListing } from "@/lib/cars";

export const Route = createFileRoute("/cars/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل السيارة — حكيم AI" },
      { name: "description", content: "مواصفات وسعر السيارة ومعلومات المعرض والمدينة." },
      { property: "og:title", content: "تفاصيل السيارة — حكيم AI" },
      { property: "og:description", content: "مواصفات وسعر السيارة ومعلومات المعرض." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CarDetail,
  errorComponent: () => (
    <div className="container py-16 text-center text-sm text-muted-foreground">
      تعذّر تحميل السيارة، حاول مرة أخرى.
    </div>
  ),
  notFoundComponent: () => (
    <div className="container py-16 text-center text-sm text-muted-foreground">
      لم نعثر على هذه السيارة.
    </div>
  ),
});

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3">
      <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
        {icon} {label}
      </span>
      <span className="mt-1 block text-sm font-black text-foreground">{value}</span>
    </div>
  );
}

function CarDetail() {
  const { id } = Route.useParams();
  const [car, setCar] = useState<CarListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchCarById(id).then((c) => {
      if (!alive) return;
      setCar(c);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return <div className="container py-16 text-center text-sm text-muted-foreground">جارِ التحميل…</div>;
  }

  if (!car) {
    return (
      <div className="container space-y-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">لم نعثر على هذه السيارة، قد تكون بيعت أو أُزيلت.</p>
        <Link to="/cars" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
          العودة لعروض السيارات <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container space-y-5 py-6">
      <Link to="/cars" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
        <ArrowRight className="h-4 w-4" /> كل السيارات
      </Link>

      <header className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
        <h1 className="flex items-center gap-2 text-2xl font-black text-foreground">
          <Car className="h-6 w-6 text-primary" /> {car.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {car.brand} {car.model ?? ""} · موديل {car.year} · {car.condition}
        </p>
        <div className="mt-3 flex items-end gap-3">
          <span className="text-2xl font-black text-primary">{formatSar(car.price)}</span>
          {car.originalPrice && car.originalPrice > car.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatSar(car.originalPrice)}
            </span>
          )}
        </div>
        {car.linkUrl && (
          <a
            href={car.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            زيارة المعرض
          </a>
        )}
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Spec icon={<MapPin className="h-3.5 w-3.5" />} label="المدينة" value={car.city} />
        <Spec
          icon={<Gauge className="h-3.5 w-3.5" />}
          label="الممشى"
          value={`${car.mileageKm.toLocaleString("ar-SA")} كم`}
        />
        <Spec icon={<Fuel className="h-3.5 w-3.5" />} label="الوقود" value={car.fuel} />
        <Spec
          icon={<Settings2 className="h-3.5 w-3.5" />}
          label="ناقل الحركة"
          value={car.transmission}
        />
        <Spec icon={<Car className="h-3.5 w-3.5" />} label="الهيكل" value={car.bodyType} />
        <Spec icon={<Users className="h-3.5 w-3.5" />} label="المقاعد" value={`${car.seats}`} />
        {car.color && <Spec icon={<Car className="h-3.5 w-3.5" />} label="اللون" value={car.color} />}
        {car.dealer && (
          <Spec icon={<MapPin className="h-3.5 w-3.5" />} label="المعرض" value={car.dealer} />
        )}
      </section>

      {car.features.length > 0 && (
        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
          <h2 className="mb-3 text-base font-black text-foreground">المواصفات والمزايا</h2>
          <ul className="flex flex-wrap gap-2">
            {car.features.map((f) => (
              <li
                key={f}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
              >
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
