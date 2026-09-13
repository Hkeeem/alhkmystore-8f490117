import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as typedSupabase } from '../integrations/supabase/client';
import type { DealView } from '../lib/deals';

const supabase = typedSupabase as unknown as SupabaseClient;

export default function NotificationsIndicator() {
  const [latest, setLatest] = useState<DealView | null>(null);
  const [totalToday, setTotalToday] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    supabase
      .from('gallery_deal_views')
      .select('id', { count: 'exact', head: true })
      .gte('viewed_at', startOfToday.toISOString())
      .then(({ count }) => setTotalToday(count ?? 0));

    const channel = supabase
      .channel('deal-views-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gallery_deal_views' },
        (payload) => {
          const v = payload.new as DealView;
          setLatest(v);
          setTotalToday((n) => n + 1);
          setPulse(true);
          setTimeout(() => setPulse(false), 1200);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div dir="rtl" className={pulse ? 'notif-indicator notif-pulse' : 'notif-indicator'}>
      <span className="notif-dot" aria-hidden />
      <span className="notif-text">
        {totalToday > 0 ? `${totalToday} نشاط جديد اليوم` : 'لا نشاط جديد اليوم'}
      </span>
      {latest && (
        <span className="notif-latest">
          {latest.view_type === 'click' ? 'نقرة' : 'مطالعة'}
          {latest.viewed_at ? ` · ${new Date(latest.viewed_at).toLocaleTimeString('ar-EG')}` : ''}
        </span>
      )}
    </div>
  );
}
