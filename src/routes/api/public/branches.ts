import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { branches, CITIES } from "@/data/store-branches";
import { stores } from "@/data/deals";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type PublicBranch = {
  id: string;
  name: string;
  city: string;
  district: string | null;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  whatsapp: string | null;
  hours: string | null;
  baladyUrl: string | null;
  verified: boolean;
  store: { id: string; name: string; category: string | null; logoUrl: string | null };
  directionsUrl: string;
};

/** بيانات فروع «خريطتي» العامة لمشاركتها مع تطبيقات حكيم الأخرى (قراءة فقط) */
export const Route = createFileRoute("/api/public/branches")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const city = url.searchParams.get("city")?.slice(0, 40) || null;
        const store = url.searchParams.get("store")?.slice(0, 40) || null;
        const storeMap = new Map(stores.map((s) => [s.id, s]));

        const items: PublicBranch[] = [];

        // الفروع الحقيقية المحفوظة في قاعدة البيانات
        try {
          const supabaseUrl = process.env["SUPABASE_URL"];
          const supabaseKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
          if (supabaseUrl && supabaseKey) {
            const db = createClient(supabaseUrl, supabaseKey, {
              auth: { persistSession: false },
            });
            let q = db
              .from("store_branches")
              .select(
                "id,store_id,store_name,name,city,district,address,lat,lng,phone,whatsapp,hours,balady_url,maps_url",
              )
              .eq("is_active", true);
            if (city) q = q.eq("city", city);
            if (store) q = q.eq("store_id", store);
            const { data } = await q;
            for (const b of data ?? []) {
              const s = storeMap.get(b.store_id);
              items.push({
                id: b.id,
                name: b.name,
                city: b.city,
                district: b.district,
                address: b.address,
                lat: b.lat,
                lng: b.lng,
                phone: b.phone,
                whatsapp: b.whatsapp,
                hours: b.hours,
                baladyUrl: b.balady_url,
                verified: true,
                store: {
                  id: b.store_id,
                  name: b.store_name || s?.name || b.store_id,
                  category: s?.category ?? null,
                  logoUrl: s?.logoUrl ?? null,
                },
                directionsUrl:
                  b.maps_url ||
                  `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`,
              });
            }
          }
        } catch {
          // في حال تعذّر الوصول لقاعدة البيانات نكتفي بالفروع التقديرية
        }

        // فروع تقديرية للعرض على الخريطة (غير موثقة)
        for (const b of branches) {
          if ((city && b.city !== city) || (store && b.storeId !== store)) continue;
          const s = storeMap.get(b.storeId);
          items.push({
            id: b.id,
            name: b.name,
            city: b.city,
            district: null,
            address: null,
            lat: b.lat,
            lng: b.lng,
            phone: null,
            whatsapp: null,
            hours: null,
            baladyUrl: null,
            verified: false,
            store: {
              id: b.storeId,
              name: s?.name ?? b.storeId,
              category: s?.category ?? null,
              logoUrl: s?.logoUrl ?? null,
            },
            directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`,
          });
        }

        return Response.json(
          {
            updatedAt: new Date().toISOString(),
            cities: CITIES,
            count: items.length,
            verifiedCount: items.filter((i) => i.verified).length,
            branches: items,
          },
          { headers: { ...CORS, "Cache-Control": "public, max-age=300" } },
        );
      },
    },
  },
});
