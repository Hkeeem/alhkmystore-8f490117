import { createServerFn } from "@tanstack/react-start";

export const getHkeeemCatalog = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { limit?: unknown };
    const n = Number(d.limit);
    return { limit: Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 100) : 24 };
  })
  .handler(async ({ data }) => {
    const { fetchHkeeemCatalog } = await import("@/lib/hkeeem-catalog.server");
    return fetchHkeeemCatalog(data.limit);
  });
