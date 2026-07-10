import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { deals, getStore, discountPercent, comparableGroups } from "@/data/deals";
import { ArrowRight, Clock, Flame, Share2 } from "lucide-react";
import { useState } from "react";
import { ShareSheet, buildDealShareText } from "@/components/ShareSheet";

export const Route = createFileRoute("/deals/$id")({
  head: ({ params }) => {
    const deal = deals.find((d) => d.id === params.id);
    const title = deal ? `عرض ${deal.title} — وفّر` : "العرض — وفّر";
    const description = deal
      ? `قارن أسعار ${deal.title} ووفّر حتى ${discountPercent(deal)}٪`
      : "تفاصيل العرض";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: DealDetailPage,
  notFoundComponent: DealNotFound,
});

function DealDetailPage() {
  const { id } = Route.useParams();
  const deal = deals.find((d) => d.id === id);
  if (!deal) throw notFound();

  const store = getStore(deal.storeId);
  const off = discountPercent(deal);
  const isHot = off >= 45;
  const [shareOpen, setShareOpen] = useState(false);

  const groups = comparableGroups();
  const sameProduct =
    groups
      .find((g) => g.some((d) => d.id === id))
      ?.filter((d) => d.id !== id)
      .sort((a, b) => a.price - b.price) || [];

  const dealUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/deals/${deal.id}`
      : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <Link
          to="/deals"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للعروض
        </Link>

        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
          <div className="bg-gradient-to-br from-secondary to-muted rounded-[2rem] aspect-square md:aspect-auto md:h-full flex items-center justify-center text-[8rem] md:text-[10rem] relative">
            <span className="drop-shadow-sm">{deal.image}</span>
            {isHot && (
              <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-hot text-hot-foreground text-sm font-bold shadow-soft">
                <Flame className="w-4 h-4" />
                عرض ناري
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-gradient-hero text-primary-foreground px-4 py-2 rounded-full text-lg font-black shadow-soft">
              −{off}%
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
                  style={{ background: store.color }}
                >
                  {store.logo}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{store.category}</p>
                  <p className="font-bold">{store.name}</p>
                </div>
              </div>
              <h1 className="font-display font-black text-2xl md:text-4xl leading-tight">
                {deal.title}
              </h1>
              {deal.brand && (
                <p className="text-muted-foreground mt-1">{deal.brand}</p>
              )}
            </div>

            <div className="flex items-end gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">السعر الحالي</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-black text-4xl md:text-5xl text-primary">
                    {deal.price}
                  </span>
                  <span className="text-xl text-muted-foreground">ر.س</span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground mb-1">بدلاً من</p>
                <span className="text-xl text-muted-foreground line-through">
                  {deal.originalPrice} ر.س
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary text-sm font-medium">
                <Clock className="w-4 h-4 text-muted-foreground" />
                ينتهي خلال {deal.expiresIn}
              </div>
              {deal.unit && (
                <div className="px-4 py-2 rounded-full bg-secondary text-sm font-medium">
                  {deal.unit}
                </div>
              )}
              {deal.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>

            <button
              onClick={() => setShareOpen(true)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-gradient-hero text-primary-foreground px-8 py-4 rounded-2xl font-black shadow-glow hover:shadow-soft transition"
            >
              <Share2 className="w-5 h-5" />
              شارك العرض
            </button>
          </div>
        </div>

        {sameProduct.length > 0 && (
          <div className="mt-10 md:mt-16">
            <h2 className="font-display font-black text-xl md:text-2xl mb-4">
              نفس المنتج بأسعار ثانية
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sameProduct.map((d) => {
                const s = getStore(d.storeId);
                const o = discountPercent(d);
                return (
                  <Link
                    key={d.id}
                    to="/deals/$id"
                    params={{ id: d.id }}
                    className="group bg-card rounded-2xl p-4 border border-border/50 hover:border-primary transition flex items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-2xl">
                      {d.image}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-black"
                          style={{ background: s.color }}
                        >
                          {s.logo}
                        </div>
                        <span className="text-xs text-muted-foreground">{s.name}</span>
                      </div>
                      <p className="font-bold text-sm line-clamp-1">{d.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-display font-black text-primary">
                          {d.price} ر.س
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          {d.originalPrice} ر.س
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-black text-primary">−{o}%</div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`عرض ${deal.title}`}
        text={buildDealShareText(deal, store.name, off)}
        url={dealUrl}
      />
    </div>
  );
}

function DealNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="font-display font-black text-2xl mb-2">ما لقينا العرض</h1>
      <p className="text-muted-foreground mb-6">
        العرض اللي تبحث عنه مو موجود أو انتهى.
      </p>
      <Link
        to="/deals"
        className="inline-flex items-center gap-2 bg-gradient-hero text-primary-foreground px-6 py-3 rounded-2xl font-bold shadow-glow"
      >
        <ArrowRight className="w-4 h-4" />
        اكتشف العروض
      </Link>
    </div>
  );
}
