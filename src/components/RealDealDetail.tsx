import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, ExternalLink, MapPin, ShieldCheck, Tag } from "lucide-react";
import { fetchRealDealById } from "@/lib/real-deals";
import { InvalidLinkFallback } from "@/components/InvalidLinkFallback";

function pct(original: number, price: number) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

/** صفحة تفاصيل عرض حقيقي (تاجر موثّق أو مصدر خارجي مثل نون) */
export function RealDealDetail({ id }: { id: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["real-deal", id],
    queryFn: () => fetchRealDealById(id),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (isPending) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <div className="h-64 rounded-3xl bg-muted animate-pulse" />
        <div className="h-6 w-2/3 rounded-xl bg-muted animate-pulse" />
        <div className="h-6 w-1/3 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <InvalidLinkFallback
        icon="🔍"
        title="ما لقينا هذا العرض"
        message="يمكن العرض انتهى أو الرابط قديم. تصفّح العروض المتاحة الآن."
        backTo={{ to: "/deals", label: "كل العروض" }}
      />
    );
  }

  const deal = data;
  const off = pct(deal.originalPrice, deal.price);
  const saving = Math.max(0, deal.originalPrice - deal.price);
  const storeLabel = deal.source ?? "المتجر";
  const hasImage = deal.image?.startsWith("http");

  return (
    <main className="max-w-4xl mx-auto px-4 pt-5 pb-14 space-y-5">
      <div className="flex items-center gap-2">
        <Link
          to="/deals"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card border border-border/60 text-sm font-bold"
        >
          <ArrowRight className="w-4 h-4 shrink-0" />
          كل العروض
        </Link>
      </div>

      <div className="rounded-3xl overflow-hidden border border-border/60 bg-gradient-to-br from-secondary to-muted aspect-[4/3] sm:aspect-[16/9] flex items-center justify-center relative">
        {hasImage ? (
          <img
            src={deal.image}
            alt={deal.title}
            className="w-full h-full object-contain bg-white"
          />
        ) : (
          <span className="text-7xl">{deal.image}</span>
        )}
        {off > 0 && (
          <span className="absolute bottom-3 left-3 bg-gradient-hero text-primary-foreground px-3.5 py-1.5 rounded-full text-base font-black shadow-soft">
            −{off}%
          </span>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground">{storeLabel}</p>
        <h1 className="font-display font-black text-xl sm:text-2xl leading-snug">{deal.title}</h1>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card p-4 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">السعر بعد الخصم</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-3xl text-primary">{deal.price}</span>
              <span className="text-sm text-muted-foreground">ر.س</span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground mb-1">سعره في {storeLabel}</p>
            <span className="text-lg text-muted-foreground line-through">
              {deal.originalPrice} ر.س
            </span>
          </div>
        </div>
        {saving > 0 && (
          <p className="text-sm font-bold text-success">توفير {saving.toFixed(2)} ر.س</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-xs font-medium">
            <Clock className="w-3.5 h-3.5" /> ينتهي خلال {deal.expiresIn}
          </span>
          {deal.unit && (
            <span className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium">
              {deal.unit}
            </span>
          )}
          {deal.couponCode && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black">
              <Tag className="w-3.5 h-3.5" /> {deal.couponCode}
            </span>
          )}
        </div>
      </div>

      {deal.productUrl ? (
        <a
          href={deal.productUrl}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-hero text-primary-foreground px-6 py-4 rounded-2xl font-black shadow-glow"
        >
          <ExternalLink className="w-5 h-5" />
          افتح المنتج في {storeLabel}
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">لا يوجد رابط مباشر لهذا العرض حالياً.</p>
      )}

      <Link
        to="/maps"
        search={{ deal: deal.id }}
        className="w-full inline-flex items-center justify-center gap-2 bg-card border border-primary/30 text-primary px-6 py-3.5 rounded-2xl font-black"
      >
        <MapPin className="w-5 h-5" />
        اعرض على الخريطة
      </Link>

      <p className="flex items-start gap-2 text-xs text-muted-foreground leading-6">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        الأسعار تتحدّث تلقائياً من مصدر العرض، وقد تتغيّر في المتجر. بعض الروابط شراكة تسويقية.
      </p>
    </main>
  );
}
