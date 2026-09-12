import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ExternalLink } from "lucide-react";
import { fetchShowroomOffers } from "@/lib/showcase";

export const Route = createFileRoute("/showroom")({
  head: () => ({
    meta: [
      { title: "معرض حكيم — أفضل عروض الوكالات والعلامات" },
      {
        name: "description",
        content:
          "معرض حكيم يجمع أقوى عروض وخصومات الوكالات والعلامات التجارية المعروفة في السعودية، محدّثة تلقائياً.",
      },
      { property: "og:title", content: "معرض حكيم — أفضل عروض الوكالات والعلامات" },
      {
        property: "og:description",
        content: "أقوى خصومات العلامات التجارية والوكالات في مكان واحد.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alhkmystore.lovable.app/showroom" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://alhkmystore.lovable.app/showroom" }],
  }),
  component: ShowroomPage,
});

function ShowroomPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["showroom-offers"],
    queryFn: () => fetchShowroomOffers(24),
    staleTime: 60_000,
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-5" dir="rtl">
      <header className="rounded-3xl bg-gradient-hero p-5 md:p-8 shadow-glow">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/35 text-sm font-bold border border-primary/50 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          معرض حكيم
        </div>
        <h1 className="font-black text-2xl md:text-4xl leading-snug">
          أفضل عروض الوكالات والعلامات التجارية
        </h1>
        <p className="mt-2 text-sm md:text-base opacity-90">
          يتم تحديث المعرض تلقائياً بأحدث الخصومات المعتمدة.
        </p>
      </header>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 rounded-3xl bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-3xl border border-border/60 bg-card p-6 text-center space-y-3">
          <p className="font-bold">تعذّر تحميل عروض المعرض الآن.</p>
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
          لا توجد عروض معروضة حالياً. سيتم تحديث المعرض تلقائياً عند توفر عروض جديدة.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {(data ?? []).map((o) => (
          <article
            key={o.id}
            className="bg-card rounded-3xl border border-border/60 shadow-card overflow-hidden flex flex-col"
          >
            <div className="aspect-[4/3] bg-secondary overflow-hidden">
              {o.image_url ? (
                <img
                  src={o.image_url}
                  alt={o.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary">
                  <Sparkles className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-primary">{o.brand}</span>
              <h2 className="text-sm font-bold leading-snug line-clamp-2">{o.title}</h2>
              <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                <div>
                  {o.price !== null && (
                    <div className="font-display font-black text-gold-shine">{o.price} ر.س</div>
                  )}
                  {o.original_price !== null && (
                    <div className="text-[11px] text-muted-foreground line-through">
                      {o.original_price} ر.س
                    </div>
                  )}
                </div>
                {o.discount_percent > 0 && (
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-success text-success-foreground">
                    -{o.discount_percent}%
                  </span>
                )}
              </div>
              {o.offer_url && (
                <a
                  href={o.offer_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  className="mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-primary/10 border border-primary/30 text-primary py-2"
                >
                  فتح العرض <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
