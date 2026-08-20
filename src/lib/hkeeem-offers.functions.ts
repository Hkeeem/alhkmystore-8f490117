import { createServerFn } from "@tanstack/react-start";

export const getHkeeemOffers = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as {
      category?: unknown;
      platform?: unknown;
      storeId?: unknown;
      minDiscount?: unknown;
    };
    const clean = (v: unknown) => String(v ?? "").trim().slice(0, 80) || undefined;
    const n = Number(d.minDiscount);
    return {
      category: clean(d.category),
      platform: clean(d.platform),
      storeId: clean(d.storeId),
      minDiscount: Number.isFinite(n) && n > 0 ? Math.min(n, 100) : undefined,
    };
  })
  .handler(async ({ data }) => {
    const { fetchHkeeemOffers } = await import("@/lib/hkeeem-offers.server");
    return fetchHkeeemOffers(data);
  });

export const getHkeeemStores = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchHkeeemStores } = await import("@/lib/hkeeem-offers.server");
  return fetchHkeeemStores();
});

export const getHkeeemIntegrationStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getHkeeemStatus } = await import("@/lib/hkeeem-offers.server");
  return getHkeeemStatus();
});

