import { createServerFn } from "@tanstack/react-start";

/**
 * مزامنة عروض منصة حكيم مع نفس جدول العروض الخارجية (source = "hkeeem")،
 * حتى تندمج تلقائياً مع عروض التجّار في «كل العروض» وفي الخريطة — تماماً كمزامنة نون.
 */
export const runHkeeemSyncNow = createServerFn({ method: "POST" }).handler(async () => {
  const { fetchHkeeemOffers } = await import("@/lib/hkeeem-offers.server");
  const { recordSyncEvent } = await import("@/lib/external-sync.server");

  let offers: Awaited<ReturnType<typeof fetchHkeeemOffers>> = [];
  try {
    offers = await fetchHkeeemOffers({});
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذّر جلب عروض حكيم";
    await recordSyncEvent({ source: "hkeeem", status: "failure", code: "http_error", message });
    return { success: false as const, count: 0, error: "fetch_failed" };
  }

  const rows = offers
    .filter((o) => o.price !== null && o.price > 0)
    .map((o) => {
      const price = Number(o.price);
      const original = o.originalPrice && o.originalPrice > price ? Number(o.originalPrice) : price;
      const discount =
        o.discountPercent !== null && o.discountPercent > 0
          ? Math.round(o.discountPercent)
          : original > price
            ? Math.round(((original - price) / original) * 100)
            : 0;
      return {
        source: "hkeeem",
        source_key: o.id,
        store_id: (o.storeId ?? o.storeName ?? "hkeeem").toLowerCase(),
        store_name: o.storeName ?? "منصة حكيم",
        title: o.title,
        category: o.category ?? "سوبرماركت",
        original_price: original,
        price,
        discount_percent: discount,
        image_url: o.imageUrl,
        product_url: o.purchaseUrl,
        active: true,
        fetched_at: new Date().toISOString(),
      };
    });

  if (rows.length === 0) {
    await recordSyncEvent({
      source: "hkeeem",
      status: "failure",
      code: "empty_result",
      message: "لم تُرجع منصة حكيم أي عروض صالحة",
    });
    return { success: false as const, count: 0, error: "empty_result" };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("external_deals")
    .upsert(rows, { onConflict: "source,source_key" });

  if (error) {
    await recordSyncEvent({
      source: "hkeeem",
      status: "failure",
      code: "upsert_failed",
      message: error.message,
    });
    return { success: false as const, count: 0, error: "upsert_failed" };
  }

  // تعطيل عروض حكيم التي لم تعد تظهر في المصدر منذ 24 ساعة
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from("external_deals")
    .update({ active: false })
    .eq("source", "hkeeem")
    .eq("active", true)
    .lt("fetched_at", cutoff);

  await recordSyncEvent({ source: "hkeeem", status: "success", message: `${rows.length} عرضًا` });
  return { success: true as const, count: rows.length };
});
