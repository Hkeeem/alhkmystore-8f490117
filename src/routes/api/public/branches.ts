import { createFileRoute } from "@tanstack/react-router";
import { branches, CITIES } from "@/data/store-branches";
import { stores } from "@/data/deals";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
        const items = branches
          .filter((b) => (!city || b.city === city) && (!store || b.storeId === store))
          .map((b) => {
            const s = storeMap.get(b.storeId);
            return {
              id: b.id,
              name: b.name,
              city: b.city,
              lat: b.lat,
              lng: b.lng,
              store: { id: b.storeId, name: s?.name ?? b.storeId, category: s?.category ?? null, logoUrl: s?.logoUrl ?? null },
              directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`,
            };
          });
        return Response.json(
          { updatedAt: new Date().toISOString(), cities: CITIES, count: items.length, branches: items },
          { headers: { ...CORS, "Cache-Control": "public, max-age=300" } },
        );
      },
    },
  },
});
