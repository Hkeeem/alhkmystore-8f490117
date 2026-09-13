import { Link } from "@tanstack/react-router";
import { Loader2, RefreshCw } from "lucide-react";
import { discountPercent } from "@/data/deals";
import { useRealDeals } from "@/hooks/use-real-deals";
import { DealCard } from "@/components/DealCard";
import { VAT_NOTE } from "@/lib/vat";

/** عروض اليوم الحية — مصدرها قاعدة البيانات مباشرة (عروض تجّار موثّقين + مصادر خارجية نشطة) */
export function OffersSection() {
  const { data, isPending, isError, refetch, isFetching } = useRealDeals(60);

  const offers = [...(data ?? [])]
    .sort((a, b) => discountPercent(b) - discountPercent(a))
    .slice(0, 8);

  return (
    <section>
      <div className="flex items-end justify-between mb-4 gap-3">
        <div>
          <h2 className="font-black text-2xl md:text-3xl">🔥 عروض اليوم — حية</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{VAT_NOTE}</p>
        </div>
        <Link to="/deals" className="text-xs font-bold text-primary shrink-0">
          عرض الكل ←
        </Link>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> جارٍ تحميل العروض الحية…
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border/60 bg-card p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">تعذّر تحميل العروض الآن.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /> إعادة المحاولة
          </button>
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
          لا توجد عروض نشطة حالياً — نعرض فقط العروض الحقيقية الموثّقة.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {offers.map((d, i) => (
            <DealCard key={d.id} deal={d} rank={i + 1} />
          ))}
        </div>
      )}
    </section>
  );
}
