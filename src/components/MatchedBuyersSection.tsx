import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Sparkles, UserCheck, Tag, MapPin, Loader2 } from 'lucide-react';

interface MatchedBuyer {
  buyer_id: string;
  full_name: string;
  phone: string;
  max_price: number;
  match_score: number;
  district?: string;
}

interface Props {
  property: {
    title?: string;
    city: string;
    district?: string;
    property_type: string;
    price: number;
    bedrooms?: number;
    features?: string[];
  };
}

export const MatchedBuyersSection: React.FC<Props> = ({ property }) => {
  const [buyers, setBuyers] = useState<MatchedBuyer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!property.city || !property.price) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('match_buyers_for_property', {
          p_city: property.city,
          p_district: property.district || '',
          p_property_type: property.property_type,
          p_price: Number(property.price),
          p_bedrooms: Number(property.bedrooms) || 0,
          p_features: property.features || []
        });

        if (!error && data) {
          setBuyers(data as MatchedBuyer[]);
        }
      } catch (err) {
        console.error('Error fetching matched buyers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [property]);

  const openWhatsApp = (phone: string, name: string, score: number) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1);
    const text = encodeURIComponent(
      `السلام عليكم أخي ${name}، يتوفر لدينا عقار يطابق متطلبات بحثك (${property.title || 'عقار جديد'}) بنسبة تطابق ${score}%. يسعدنا تواصلك معنا.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 gap-2 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">جاري البحث عن مشترين متطابقين...</span>
      </div>
    );
  }

  if (buyers.length === 0) return null;

  return (
    <div className="w-full space-y-4 my-6 font-sans" dir="rtl">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            مشترون مهتمون بعقارك ({buyers.length})
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {buyers.map((buyer) => (
          <div
            key={buyer.buyer_id}
            className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                  {buyer.full_name}
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-600">
                  {buyer.match_score}% تطابق
                </span>
              </div>

              <div className="my-3 space-y-1 text-xs text-gray-600 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>الميزانية: <strong>{buyer.max_price.toLocaleString('ar-SA')} ر.س</strong></span>
                </div>
                {buyer.district && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>الحي: {buyer.district}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => openWhatsApp(buyer.phone, buyer.full_name, buyer.match_score)}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              تواصل عبر واتساب
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
