import { useEffect, useState } from "react";
import { fetchStorePrices, fetchActiveCoupons } from "@/integrations/hkeeem-prices";
import { Sparkles, Ticket, Tag } from "lucide-react";

export function LivePricesSection() {
  const [prices, setPrices] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const pricesData = await fetchStorePrices();
        const couponsData = await fetchActiveCoupons();
        setPrices(pricesData || []);
        setCoupons(couponsData || []);
      } catch (err) {
        console.error("Error fetching live data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">جاري تحميل الأسعار الحية والكوبونات...</div>;
  }

  return (
    <div className="space-y-6 my-6">
      {/* قسم الأسعار الحية */}
      <div className="bg-card rounded-3xl p-6 border border-border/60 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">الأسعار الحية من قاعدة البيانات (شاملة ضريبة 15%)</h2>
        </div>

        {prices.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد أسعار متاحة حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {prices.map((item, idx) => (
              <div key={item.id || idx} className="p-4 rounded-2xl bg-secondary/50 border border-border/40 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm">{item.products?.name_ar || item.product_id || "منتج"}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-primary" /> متجر رقم: {item.store_id?.slice(0, 6) || "متجر"}
                  </p>
                </div>
                <div className="text-left">
                  <span className="font-black text-primary text-base">{item.price_with_tax || item.price_before_tax} ر.س</span>
                  <span className="block text-[10px] text-muted-foreground">قبل الضريبة: {item.price_before_tax} ر.س</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* قسم الكوبونات النشطة */}
      <div className="bg-card rounded-3xl p-6 border border-border/60 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Ticket className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">كوبونات الخصم النشطة</h2>
        </div>

        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد كوبونات متاحة حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {coupons.map((coupon, idx) => (
              <div key={coupon.id || idx} className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex justify-between items-center">
                <div>
                  <span className="text-xs text-muted-foreground block">رمز الكوبون</span>
                  <span className="font-mono font-black text-lg text-primary">{coupon.code}</span>
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
                    خصم {coupon.discount_value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
