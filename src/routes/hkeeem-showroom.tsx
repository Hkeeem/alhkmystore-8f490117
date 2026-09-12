import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, RefreshCw, Store } from "lucide-react";
import { getShowroomOffers } from "@/lib/showcase.functions";

export const Route = createFileRoute("/hkeeem-showroom")({
  head: () => ({ meta: [{ title: "معرض حكيم — HkeeemAI" }] }),
  component: HkeeemShowroomPage,
});

function HkeeemShowroomPage() {
  const fetchOffers = useServerFn(getShowroomOffers);
  const query = useQuery({
    queryKey: ["showroom-offers-page"],
    queryFn: () => fetchOffers({ data: { limit: 60 } }),
    staleTime: 60_000,
  });
  const offers = query.data ?? [];

  return (
    <main dir="rtl" className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-primary">HkeeemAI</p>
          <h1 className="text-3xl font-black">معرض حكيم</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            أفضل الإعلانات والعروض المرتبة من مصادر حكيم الموثوقة.
          </p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold"
        >
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> تحديث
        </button>
      </header>
      {query.isPending ? (
        <p className="rounded-3xl border p-8 text-center">جارٍ تحميل المعرض…</p>
      ) : offers.length === 0 ? (
        <p className="rounded-3xl border p-8 text-center text-muted-foreground">
          لا توجد إعلانات منشورة حاليًا.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {offers.map((offer) => (
            <article
              key={offer.id}
              className="flex flex-col overflow-hidden rounded-3xl border bg-card shadow-card"
            >
              {offer.image_url ? (
                <img
                  src={offer.image_url}
                  alt={offer.title}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="grid aspect-[4/3] place-items-center bg-secondary">
                  <Store className="h-10 w-10 text-primary" />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <span className="text-xs font-bold text-primary">
                  {offer.brand} · {offer.category}
                </span>
                <h2 className="line-clamp-2 font-black">{offer.title}</h2>
                {offer.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{offer.description}</p>
                )}
                <div className="mt-auto flex items-center gap-2 text-sm font-black">
                  {offer.price !== null && <span>{offer.price} ر.س</span>}
                  {offer.discount_percent > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                      خصم {offer.discount_percent}%
                    </span>
                  )}
                </div>
                {offer.offer_url && (
                  <a
                    href={offer.offer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-black text-primary-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> فتح الإعلان
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
