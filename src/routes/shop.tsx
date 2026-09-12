import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, ExternalLink, MapPin } from "lucide-react";
import { fetchHarajListings } from "@/lib/showcase";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "تسوّق حكيم — أبرز الإعلانات المميزة" },
      {
        name: "description",
        content:
          "تسوّق حكيم يعرض أبرز خمسة إعلانات مميزة ونشطة، مع السعر والمدينة ورابط الإعلان الأصلي.",
      },
      { property: "og:title", content: "تسوّق حكيم — أبرز الإعلانات المميزة" },
      {
        property: "og:description",
        content: "أهم الإعلانات النشطة مختارة لك في مكان واحد.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alhkmystore.lovable.app/shop" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://alhkmystore.lovable.app/shop" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["haraj-listings"],
    queryFn: () => fetchHarajListings(5),
    staleTime: 60_000,
  });

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-5" dir="rtl">
      <header className="rounded-3xl bg-gradient-hero p-5 md:p-8 shadow-glow">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/35 text-sm font-bold border border-primary/50 mb-3">
          <ShoppingBag className="w-3.5 h-3.5 text-primary" />
          تسوّق حكيم
        </div>
        <h1 className="font-black text-2xl md:text-4xl leading-snug">أبرز الإعلانات المميزة</h1>
        <p className="mt-2 text-sm md:text-base opacity-90">
          خمسة إعلانات نشطة مختارة، تُحدَّث تلقائياً كل ساعتين.
        </p>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-3xl border border-border/60 bg-card p-6 text-center space-y-3">
          <p className="font-bold">تعذّر تحميل الإعلانات الآن.</p>
          <button
            onClick={() => refetch()}
            className="bg-gradient-gold font-bold px-4 py-2 rounded-xl"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <div className="rounded-3xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          لا توجد إعلانات نشطة حالياً. ستظهر هنا فور توفّرها من المصدر.
        </div>
      )}

      <div className="space-y-3">
        {(data ?? []).map((l) => (
          <a
            key={l.id}
            href={l.post_url}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="flex gap-3 bg-card rounded-3xl border border-border/60 shadow-card overflow-hidden hover-lift"
          >
            <div className="w-28 shrink-0 bg-secondary">
              {l.image_url ? (
                <img
                  src={l.image_url}
                  alt={l.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 p-3">
              <h2 className="font-bold text-sm leading-snug line-clamp-2">{l.title}</h2>
              {l.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                {l.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {l.city}
                  </span>
                )}
                {l.price !== null && (
                  <span className="font-display font-black text-gold-shine text-sm">
                    {l.price} ر.س
                  </span>
                )}
                <span className="inline-flex items-center gap-1 mr-auto text-primary font-bold">
                  فتح الإعلان <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
