import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; 

interface Offer {
  id: string;
  title: string;
  store_name: string;
  discount: string;
  affiliate_link: string;
  coupon_code: string;
}

export function MitgoOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const { data, error } = await supabase
          .from("mitgo_offers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) setOffers(data);
      } catch (err) {
        console.error("Error fetching offers:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">جاري تحميل أحدث العروض...</div>;
  }

  if (offers.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">لا توجد عروض مضافة حالياً. انتظر الروبوت قريباً!</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {offers.map((offer) => (
        <div key={offer.id} className="border rounded-2xl p-4 bg-card shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
              {offer.store_name}
            </span>
            <h3 className="font-bold text-lg mt-2">{offer.title}</h3>
            {offer.discount && (
              <p className="text-emerald-600 font-extrabold mt-1">خصم: {offer.discount}</p>
            )}
            {offer.coupon_code && (
              <div className="mt-2 p-2 bg-muted rounded-xl text-sm font-mono text-center border border-dashed">
                الكود: <span className="font-bold text-primary">{offer.coupon_code}</span>
              </div>
            )}
          </div>
          <a
            href={offer.affiliate_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block w-full text-center bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:opacity-90 transition"
          >
            تفعيل العرض والتسوق
          </a>
        </div>
      ))}
    </div>
  );
}
