import { stores } from "./deals";

export type Branch = {
  id: string;
  storeId: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
};

/** مدن المملكة الرئيسية بإحداثيات مراكزها */
export const CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "الرياض", lat: 24.7136, lng: 46.6753 },
  { name: "جدة", lat: 21.5433, lng: 39.1728 },
  { name: "مكة المكرمة", lat: 21.3891, lng: 39.8579 },
  { name: "المدينة المنورة", lat: 24.5247, lng: 39.5692 },
  { name: "الدمام", lat: 26.4207, lng: 50.0888 },
  { name: "الخبر", lat: 26.2794, lng: 50.208 },
  { name: "أبها", lat: 18.2465, lng: 42.5117 },
  { name: "بريدة", lat: 26.3595, lng: 43.9818 },
];

const DISTRICTS = ["فرع الشمال", "فرع الوسط", "فرع الشرق", "فرع الغرب"];

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 100000;
  return h;
}

/** فروع ثابتة (deterministic) لكل متجر داخل كل مدينة */
function buildBranches(): Branch[] {
  const out: Branch[] = [];
  for (const store of stores) {
    for (const city of CITIES) {
      const seed = hash(store.id + city.name);
      const count = 1 + (seed % 2); // فرع أو فرعان لكل مدينة
      for (let i = 0; i < count; i++) {
        const s = hash(`${store.id}-${city.name}-${i}`);
        const angle = ((s * 137.5) % 360) * (Math.PI / 180);
        const radius = 0.012 + (s % 9) * 0.006;
        out.push({
          id: `${store.id}-${city.name}-${i}`,
          storeId: store.id,
          name: `${store.name} — ${DISTRICTS[s % DISTRICTS.length]} ${city.name}`,
          city: city.name,
          lat: +(city.lat + radius * Math.sin(angle)).toFixed(5),
          lng: +(city.lng + radius * Math.cos(angle) * 1.05).toFixed(5),
        });
      }
    }
  }
  return out;
}

export const branches: Branch[] = buildBranches();

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** أقرب فرع لمتجر معيّن من موقع المستخدم */
export function nearestBranch(storeId: string, from: { lat: number; lng: number }): Branch | null {
  let best: Branch | null = null;
  let bestKm = Infinity;
  for (const b of branches) {
    if (b.storeId !== storeId) continue;
    const km = distanceKm(from.lat, from.lng, b.lat, b.lng);
    if (km < bestKm) {
      bestKm = km;
      best = b;
    }
  }
  return best;
}

/** أقرب مدينة لموقع المستخدم */
export function nearestCity(from: { lat: number; lng: number }) {
  return [...CITIES].sort(
    (a, b) => distanceKm(from.lat, from.lng, a.lat, a.lng) - distanceKm(from.lat, from.lng, b.lat, b.lng)
  )[0];
}
