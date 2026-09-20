import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabaseUrl = 'https://wrycrgldsjpigapqszw.supabase.co';
const supabaseKey = 'pcycuavbjpqvfuwwqlso';
const supabase = createClient(supabaseUrl, supabaseKey);

export function OffersSection() {
  const [offers, setOffers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    async function fetchOffers() {
      try {
        let { data, error } = await supabase
          .from('property_offers')
          .select(
            'id,title,city,district,property_type,listing_type,price,features,services,created_at',
          )
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) throw error;
        setOffers(data || []);
        
        // تسجيل وقت التحديث الحالي
        setLastUpdated(new Date().toLocaleTimeString('ar-SA'));
      } catch (error) {
        console.error('خطأ في جلب العروض:', error instanceof Error ? error.message : error);
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

  if (loading) {
    return (
      <section dir="rtl" className="p-4">
        <h2 className="font-black text-2xl md:text-3xl mb-4">🔥 عروض العقارات - حية</h2>
        <div className="text-center py-8 text-muted-foreground">جاري تحميل أحدث العروض العقارية...</div>
      </section>
    );
  }

  return (
    <section dir="rtl" className="p-4 space-y-4">
      {/* رأس القسم مع حالة التحديث المباشر */}
      <div className="flex justify-between items-center">
        <h2 className="font-black text-2xl md:text-3xl">🔥 عروض العقارات - حية</h2>
        {lastUpdated && (
          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            محدث (الساعة {lastUpdated})
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {offers.map((offer: any) => (
          <div
            key={offer.id}
            className="bg-card rounded-3xl border border-border/60 p-4 hover:shadow-glow transition space-y-2 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-base font-bold mt-1 text-primary line-clamp-2">{offer.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                المدينة: {offer.city} {offer.district ? `- ${offer.district}` : ''}
              </p>
              <p className="text-xs text-muted-foreground">النوع: {offer.property_type} ({offer.listing_type})</p>
              
              <div className="flex gap-2 mt-3 items-center">
                <span className="text-green-700 font-black text-base">{offer.price} ر.س</span>
              </div>

              {/* عرض المميزات والخدمات */}
              <div className="flex flex-wrap gap-1 mt-3">
                {offer.features?.map((feat: string, idx: number) => (
                  <span key={idx} className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full">
                    {feat}
                  </span>
                ))}
                {offer.services?.map((serv: string, idx: number) => (
                  <span key={idx} className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">
                    {serv}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
