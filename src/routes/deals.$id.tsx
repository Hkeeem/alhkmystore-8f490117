import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { deals, getStore, discountPercent, comparableGroups } from "@/data/deals";
import { ArrowRight, CalendarClock, Clock, FileText, Flame, Share2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { recordInterest } from "@/lib/preferences";

import { getDealIcon } from "@/lib/icons";
import { ShareSheet, buildDealShareText } from "@/components/ShareSheet";
import { InvalidLinkFallback } from "@/components/InvalidLinkFallback";
import { DealActions } from "@/components/DealActions";
import { dealDescription, dealTerms, expiryDate, formatArabicDate } from "@/lib/deal-details";

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
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (deal) recordInterest(deal.category, deal.storeId);
  }, [deal?.id]);

  const DealIcon = getDealIcon(deal);
  const hasRealImage = deal.image?.startsWith("http") && !imgError;
  const router = useRouter();

  const description = dealDescription(deal, store);
  const terms = dealTerms(deal, store);
  const endsAt = formatArabicDate(expiryDate(deal));

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
        <div className="sticky top-2 z-20 mb-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card/90 backdrop-blur border border-border/60 shadow-md text-sm font-bold hover:border-primary/50 press-ripple transition"
          >
            <ArrowRight className="w-4 h-4 shrink-0" />
            رجوع
          </button>
          <Link
            to="/deals"
            className="inline-flex items-center gap-1 px-3 py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-primary transition"
          >
            كل العروض
          </Link>
        </div>


        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
          <div className="bg-gradient-to-br from-secondary to-muted rounded-[2rem] aspect-square md:aspect-auto md:h-full flex items-center justify-center relative overflow-hidden">
            {hasRealImage ? (
              <img
                src={deal.image}
                alt={deal.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <DealIcon className="w-32 h-32 text-primary drop-shadow-[0_0_24px_oklch(0.77_0.13_85_/_0.6)]" strokeWidth={1.2} />
            )}
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

            <DealActions deal={deal} />
          </div>
        </div>

        {/* الوصف الكامل + تاريخ الانتهاء + الشروط */}
        <div className="mt-10 md:mt-14 grid gap-4 md:gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 bg-card rounded-3xl border border-border/60 shadow-md p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <FileText className="w-5 h-5 shrink-0" />
              <h2 className="font-bold text-lg text-foreground">وصف العرض</h2>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-8">{description}</p>
          </section>

          <section className="bg-card rounded-3xl border border-border/60 shadow-md p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <CalendarClock className="w-5 h-5 shrink-0" />
              <h2 className="font-bold text-lg text-foreground">تاريخ الانتهاء</h2>
            </div>
            <p className="font-display font-black text-xl leading-8">{endsAt}</p>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 shrink-0" />
              متبقٍ تقريباً: {deal.expiresIn}
            </p>
          </section>

          <section className="lg:col-span-3 bg-card rounded-3xl border border-border/60 shadow-md p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <h2 className="font-bold text-lg text-foreground">الشروط والأحكام</h2>
            </div>
            <ul className="space-y-2.5">
              {terms.map((t) => (
                <li key={t} className="flex gap-2.5 text-sm text-muted-foreground leading-7">
                  <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
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
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-2xl overflow-hidden">
                      {d.image?.startsWith("http") ? (
                        <img src={d.image} alt={d.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <span>{d.image}</span>
                      )}
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
  const nearest = [...deals].sort((a, b) => discountPercent(b) - discountPercent(a))[0];
  return (
    <InvalidLinkFallback
      icon="🔍"
      title="ما لقينا هذا العرض"
      message="يمكن العرض انتهى أو الرابط قديم. جهّزنا لك أقوى عرض متاح الحين."
      suggestion={{
        to: `/deals/${nearest.id}`,
        label: nearest.title,
        hint: `خصم ${discountPercent(nearest)}٪ · ${nearest.price} ر.س`,
        emoji: nearest.image,
      }}
      backTo={{ to: "/deals", label: "كل العروض" }}
    />
  );
}
