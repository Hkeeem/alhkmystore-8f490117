import { Link } from "@tanstack/react-router";
import { Tag, Store, ArrowLeft } from "lucide-react";
import { useRealDeals } from "@/hooks/use-real-deals";

export function OffersSection() {
  const { data: deals = [], isLoading } = useRealDeals(12);

  if (isLoading) {
    return (
      <section dir="rtl" className="p-4">
        <h2 className="font-black text-2xl md:text-3xl mb-4">🔥 عروض اليوم</h2>
        <div className="text-center py-8 text-muted-foreground">جاري تحميل أحدث العروض...</div>
      </section>
    );
  }

  // لا نعرض قسمًا فارغًا إذا لم توجد عروض
  if (deals.length === 0) return null;

  return (
    <section dir="rtl" className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-2xl md:text-3xl">🔥 عروض اليوم</h2>
        <Link to="/deals" className="text-xs font-bold text-primary flex items-center gap-1">
          عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {deals.map((deal) => {
          const discount =
            deal.originalPrice > 0
              ? Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100)
              : 0;
          return (
            <Link
              key={deal.id}
              to="/deals/$id"
              params={{ id: deal.id }}
              className="bg-card rounded-3xl border border-border/60 p-4 hover:shadow-glow transition space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-primary line-clamp-2">{deal.title}</h3>
                  {discount > 0 && (
                    <span className="shrink-0 bg-primary/10 text-primary text-[11px] font-black px-2 py-0.5 rounded-full">
                      خصم {discount}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  {deal.source ?? "متجر"}
                </p>

                <div className="flex gap-2 mt-3 items-baseline">
                  <span className="text-green-700 font-black text-base">
                    {deal.price.toLocaleString("ar-SA")} ر.س
                  </span>
                  {deal.originalPrice > deal.price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {deal.originalPrice.toLocaleString("ar-SA")} ر.س
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  ينتهي خلال: {deal.expiresIn}
                </span>
                <span className="text-[11px] font-bold text-primary">تفاصيل العرض ‹</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
