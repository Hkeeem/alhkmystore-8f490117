import { useMemo } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { getStore, type Deal } from "@/data/deals";

/** عرض اليوم: يتغيّر تلقائيًا كل يوم ويختار من العروض الحقيقية التي لها متجر برابط رسمي */
export function DailyDeal({ deals }: { deals: Deal[] }) {
  const pick = useMemo(() => {
    const eligible = deals.filter((d) => {
      try { return !!getStore(d.storeId)?.website; } catch { return false; }
    });
    if (!eligible.length) return null;
    const day = Math.floor(Date.now() / 86_400_000);
    return eligible[day % eligible.length];
  }, [deals]);

  if (!pick) return null;
  const store = getStore(pick.storeId);
  const off = Math.round(((pick.originalPrice - pick.price) / pick.originalPrice) * 100);
  const img = pick.image.startsWith("http") ? pick.image : store.logoUrl;

  return (
    <section className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/20 via-card to-card p-4 flex gap-4 items-center">
      <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl bg-background grid place-items-center overflow-hidden">
        {img ? <img src={img} alt={pick.title} className="w-full h-full object-contain p-2" /> : <span className="text-5xl">{store.logo}</span>}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <span className="inline-flex items-center gap-1 text-xs font-black text-primary"><Sparkles className="w-4 h-4" /> عرض اليوم</span>
        <h2 className="font-black text-lg leading-snug line-clamp-2">{pick.title}</h2>
        <p className="text-sm">
          <b className="text-primary text-lg">{pick.price} ر.س</b>{" "}
          <s className="text-muted-foreground">{pick.originalPrice}</s>
          {off > 0 && <span className="mr-2 rounded-full bg-accent/20 text-accent px-2 py-0.5 text-xs font-bold">-{off}%</span>}
        </p>
        <a href={store.website} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-1 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-sm font-bold">
          <ExternalLink className="w-4 h-4" /> افتح موقع {store.name}
        </a>
      </div>
    </section>
  );
}
