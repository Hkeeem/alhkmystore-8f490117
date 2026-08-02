export interface Offer {
  id: number;
  title: string;
  store: string;
  category: 'عطور' | 'إلكترونيات' | 'سوبرماركت' | 'عقارات' | 'سيارات';
  price: number;
  old_price: number;
  discount: number;
  image: string;
  endAt: string;
  location: { lat: number; lng: number };
}

export const OFFERS: Offer[] = [
  {
    id: 1,
    title: 'عطر فاخر ديور جادور - 100 مل',
    store: 'متجر العطور الذكية',
    category: 'عطور',
    price: 380,
    old_price: 550,
    discount: 31,
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&auto=format&fit=crop&q=60',
    endAt: '2026-08-10T23:59:59',
    location: { lat: 21.4858, lng: 39.1925 }
  },
  {
    id: 2,
    title: 'سماعات أبل إيربودز برو الجيل الثاني',
    store: 'الإلكترونيات الذكية',
    category: 'إلكترونيات',
    price: 799,
    old_price: 999,
    discount: 20,
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=60',
    endAt: '2026-08-08T23:59:59',
    location: { lat: 21.4870, lng: 39.1950 }
  },
  {
    id: 3,
    title: 'سلة مقاضى السوبرماركت اليومية (عرض خاص)',
    store: 'سوبرماركت التوفير',
    category: 'سوبرماركت',
    price: 145,
    old_price: 210,
    discount: 30,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
    endAt: '2026-08-05T23:59:59',
    location: { lat: 21.4830, lng: 39.1900 }
  },
  {
    id: 4,
    title: 'فيلا مودرن بمواصفات ذكية - مخطط البساتين',
    store: 'مؤسسة محسن الحكمي للتسويق العقاري',
    category: 'عقارات',
    price: 1250000,
    old_price: 1400000,
    discount: 11,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=60',
    endAt: '2026-08-30T23:59:59',
    location: { lat: 21.5433, lng: 39.1728 }
  },
  {
    id: 5,
    title: 'عرض صيانة وتجهيز سيارات هافال (باقة الشتاء والصيف)',
    store: 'وكالة ومراكز صيانة هافال المعتمدة',
    category: 'سيارات',
    price: 650,
    old_price: 950,
    discount: 32,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&auto=format&fit=crop&q=60',
    endAt: '2026-08-15T23:59:59',
    location: { lat: 21.5169, lng: 39.2158 }
  }
];

export function haversine(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} متر`;
  return `${km.toFixed(1)} كم`;
}
