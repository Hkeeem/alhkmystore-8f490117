import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller } from "../supabase";

interface DealRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  unit: string | null;
  price: number | null;
  original_price: number | null;
  discount_percent: number | null;
  coupon_code: string | null;
  product_url: string | null;
  expires_at: string | null;
  merchants: { name: string; slug: string; city: string | null } | null;
}

export default defineTool({
  name: "search_deals",
  title: "البحث في العروض المنشورة",
  description: "يبحث في العروض المنشورة والمتاحة حاليًا مع إمكانية التصفية بالكلمة أو التصنيف أو المدينة.",
  inputSchema: {
    query: z.string().trim().optional().describe("كلمة بحث في عنوان العرض"),
    category: z.string().trim().optional().describe("تصنيف العرض"),
    city: z.string().trim().optional().describe("مدينة المتجر"),
    limit: z.number().int().optional().describe("عدد النتائج، الحد الأقصى 50"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, city, limit }, ctx) => {
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    let q = supabaseForCaller(ctx.getToken())
      .from("merchant_deals")
      .select(
        "id,title,description,category,unit,price,original_price,discount_percent,coupon_code,product_url,expires_at,merchants!inner(name,slug,city)",
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(take);

    if (query) q = q.ilike("title", `%${query}%`);
    if (category) q = q.eq("category", category);
    if (city) q = q.eq("merchants.city", city);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);

    const deals = ((data ?? []) as unknown as DealRow[]).map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      category: d.category,
      unit: d.unit,
      price: d.price,
      originalPrice: d.original_price,
      discountPercent: d.discount_percent,
      couponCode: d.coupon_code,
      productUrl: d.product_url,
      expiresAt: d.expires_at,
      store: d.merchants ? { name: d.merchants.name, slug: d.merchants.slug, city: d.merchants.city } : null,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: deals.length
            ? deals.map((d) => `${d.title} — ${d.price ?? "?"} ر.س (${d.store?.name ?? "متجر"})`).join("\n")
            : "لا توجد عروض مطابقة.",
        },
      ],
      structuredContent: { deals },
    };
  },
});
