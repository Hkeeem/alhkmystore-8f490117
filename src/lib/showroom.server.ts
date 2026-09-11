/**
 * معرض حكيم: يجمع أفضل عروض الوكالات والعلامات التجارية المعروفة
 * من العروض الخارجية النشطة وعروض التجّار المنشورة، ويحدّثها كل يومين.
 */

type Row = {
  source_key: string;
  brand: string;
  title: string;
  description: string | null;
  image_url: string | null;
  offer_url: string | null;
  category: string;
  city: string | null;
  original_price: number | null;
  price: number | null;
  discount_percent: number;
  rank: number;
  active: boolean;
  fetched_at: string;
};

export async function runShowroomSync(limit = 24) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();

  const [ext, merch] = await Promise.all([
    supabaseAdmin
      .from("external_deals")
      .select(
        "id, title, brand, store_name, category, image_url, product_url, original_price, price, discount_percent",
      )
      .eq("active", true)
      .order("discount_percent", { ascending: false })
      .limit(120),
    supabaseAdmin
      .from("merchant_deals")
      .select(
        "id, title, description, category, image_url, product_url, original_price, price, discount_percent, merchants(name, city, logo_url)",
      )
      .eq("status", "published")
      .order("discount_percent", { ascending: false })
      .limit(120),
  ]);

  const rows: Row[] = [];

  for (const d of ext.data ?? []) {
    const brand = (d.brand || d.store_name || "").trim();
    if (!brand) continue;
    rows.push({
      source_key: `external:${d.id}`,
      brand,
      title: d.title,
      description: null,
      image_url: d.image_url,
      offer_url: d.product_url,
      category: d.category || "عام",
      city: null,
      original_price: d.original_price === null ? null : Number(d.original_price),
      price: d.price === null ? null : Number(d.price),
      discount_percent: Number(d.discount_percent ?? 0),
      rank: 0,
      active: true,
      fetched_at: now,
    });
  }

  for (const d of merch.data ?? []) {
    const m = (d as { merchants?: { name?: string; city?: string; logo_url?: string } }).merchants;
    const brand = (m?.name ?? "").trim();
    if (!brand) continue;
    rows.push({
      source_key: `merchant:${d.id}`,
      brand,
      title: d.title,
      description: d.description ?? null,
      image_url: d.image_url ?? m?.logo_url ?? null,
      offer_url: d.product_url ?? `/deals/${d.id}`,
      category: d.category || "عام",
      city: m?.city ?? null,
      original_price: d.original_price === null ? null : Number(d.original_price),
      price: d.price === null ? null : Number(d.price),
      discount_percent: Number(d.discount_percent ?? 0),
      rank: 0,
      active: true,
      fetched_at: now,
    });
  }

  // علامة واحدة لكل عرض، والأعلى خصماً أولاً
  const bestPerBrand = new Map<string, Row>();
  for (const r of rows.sort((a, b) => b.discount_percent - a.discount_percent)) {
    if (!bestPerBrand.has(r.brand)) bestPerBrand.set(r.brand, r);
  }
  const top = [...bestPerBrand.values()].slice(0, limit).map((r, i) => ({ ...r, rank: i + 1 }));

  if (top.length) {
    const { error } = await supabaseAdmin
      .from("showroom_offers")
      .upsert(top, { onConflict: "source_key" });
    if (error) throw new Error(error.message);

    const keep = top.map((r) => r.source_key);
    await supabaseAdmin
      .from("showroom_offers")
      .update({ active: false })
      .not("source_key", "in", `(${keep.map((k) => `"${k}"`).join(",")})`);
  }

  await supabaseAdmin.from("sync_events").insert({
    source: "showroom",
    status: top.length ? "success" : "empty",
    message: `معرض حكيم: ${top.length} عرض`,
  });

  return { count: top.length };
}
