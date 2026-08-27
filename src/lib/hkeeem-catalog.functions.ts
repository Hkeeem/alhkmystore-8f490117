import { createServerFn } from "@tanstack/react-start";

export const getHkeeemCatalog = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { limit?: unknown };
    const n = Number(d.limit);
    return { limit: Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 100) : 24 };
  })
  .handler(async ({ data }) => {
    const { fetchHkeeemCatalog } = await import("@/lib/hkeeem-catalog.server");
    try {
      const catalog = await fetchHkeeemCatalog(data.limit);
      return { ...catalog, unavailable: false as boolean };
    } catch {
      // لا نرمي الخطأ حتى لا تنكسر الواجهة — نعيد حالة فارغة آمنة
      return {
        offers: [],
        stores: [],
        lastUpdatedAt: new Date().toISOString(),
        stale: false,
        unavailable: true as boolean,
      };
    }
  });
