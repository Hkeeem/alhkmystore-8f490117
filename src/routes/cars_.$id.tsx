import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, Car, ExternalLink, Fuel, Gauge, MapPin, Phone, Settings2, Sparkles, Armchair, PaintBucket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { carImage } from "@/lib/car-images";
import { recordOfferClick } from "@/lib/offer-clicks.functions";
import { sessionId } from "@/lib/track-deal";

export const Route = createFileRoute("/cars_/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل عرض السيارة — حكيم AI" },
      { name: "description", content: "المواصفات الكاملة والسعر بعد الخصم لعرض السيارة لدى الوكالة أو المعرض." },
      { property: "og:title", content: "تفاصيل عرض السيارة — حكيم AI" },
      { property: "og:description", content: "مواصفات السيارة، نوع الوقود، الممشى، والسعر بعد الخصم." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CarDetail,
});

const riyal = (n: number | null) => (n == null ? "—" : `${n.toLocaleString("ar-SA")} ر.س`);

function track(car: { id: string; title: string; brand: string; city: string }, surface: "detail" | "list") {
  void recordOfferClick({
    data: { kind: "car", offerId: car.id, offerTitle: car.title, storeName: `${car.brand} · ${car.city}`, surface, session: sessionId(), path: window.location.pathname },
  }).catch(() => {});
}

function CarDetail() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("car_listings").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const car = q.data;

  useEffect(() => {
    if (car) track(car, "detail");
  }, [car]);

  if (q.isLoading) return <div className="mx-auto max-w-3xl p-4"><Skeleton className="h-96 rounded-2xl" /></div>;
  if (!car)
    return (
      <div dir="rtl" className="mx-auto max-w-3xl p-8 text-center">
        <p className="mb-4 text-muted-foreground">لم نجد هذه السيارة.</p>
        <Link to="/cars" className="text-primary underline">العودة إلى السيارات</Link>
      </div>
    );

  const img = carImage(car);
  const discount = car.original_price && car.original_price > car.price ? car.original_price - car.price : 0;
  const specs: [React.ReactNode, string, string][] = [
    [<Calendar key="y" className="h-4 w-4" />, "الموديل", String(car.year)],
    [<Fuel key="f" className="h-4 w-4" />, "الوقود", car.fuel],
    [<Settings2 key="t" className="h-4 w-4" />, "ناقل الحركة", car.transmission],
    [<Gauge key="m" className="h-4 w-4" />, "الممشى", car.mileage_km > 0 ? `${car.mileage_km.toLocaleString("ar-SA")} كم` : "جديدة"],
    [<Car key="b" className="h-4 w-4" />, "النوع", car.body_type],
    [<Armchair key="s" className="h-4 w-4" />, "المقاعد", `${car.seats}`],
    [<PaintBucket key="c" className="h-4 w-4" />, "اللون", car.color ?? "—"],
    [<MapPin key="ci" className="h-4 w-4" />, "المدينة", car.city],
  ];

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-4 py-6 pb-28">
      <Link to="/cars" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4" /> العودة للنتائج
      </Link>
      <div className="relative overflow-hidden rounded-2xl bg-muted/40">
        <img src={img.src} alt={car.title} width={1024} height={640} className="aspect-[16/10] w-full object-cover" />
        {img.illustrative && (
          <span className="absolute bottom-2 start-2 rounded-full bg-card/85 px-2 py-0.5 text-[11px] text-muted-foreground">صورة توضيحية</span>
        )}
        <span className="absolute top-2 end-2 rounded-full bg-card/85 px-2 py-0.5 text-xs font-medium">{car.condition}</span>
      </div>
      <h1 className="mt-4 text-2xl font-black">{car.title}</h1>
      <p className="text-sm text-muted-foreground">{car.brand}{car.model ? ` • ${car.model}` : ""}{car.dealer ? ` — ${car.dealer}` : ""}</p>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-primary">{riyal(car.price)}</span>
          {discount > 0 && <span className="text-sm text-muted-foreground line-through">{riyal(car.original_price)}</span>}
        </div>
        {discount > 0 && <p className="mt-1 text-sm font-medium text-primary">توفّر {riyal(discount)}</p>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {specs.map(([icon, label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><span className="text-primary">{icon}</span>{label}</span>
            <b className="text-sm">{value}</b>
          </div>
        ))}
      </div>

      {car.features?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {car.features.map((f: string) => (
            <span key={f} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"><Sparkles className="h-3 w-3" />{f}</span>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {car.link_url && (
          <a href={car.link_url} target="_blank" rel="noopener noreferrer" onClick={() => track(car, "list")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
            <ExternalLink className="h-4 w-4" /> عرض لدى المورد
          </a>
        )}
        {car.phone && (
          <a href={`tel:${car.phone}`} onClick={() => track(car, "list")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold">
            <Phone className="h-4 w-4" /> اتصال
          </a>
        )}
      </div>
    </div>
  );
}
