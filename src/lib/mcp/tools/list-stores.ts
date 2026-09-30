import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller } from "../supabase";

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  city: string | null;
  website: string | null;
  logo_url: string | null;
}

export default defineTool({
  name: "list_stores",
  title: "المتاجر الموثّقة",
  description: "يعرض المتاجر الموثّقة المنشورة في التطبيق مع إمكانية التصفية بالمدينة أو التصنيف.",
  inputSchema: {
    city: z.string().trim().optional().describe("تصفية بالمدينة"),
    category: z.string().trim().optional().describe("تصفية بالتصنيف"),
    limit: z.number().int().optional().describe("عدد النتائج، الحد الأقصى 50"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, category, limit }, ctx) => {
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    let q = supabaseForCaller(ctx.getToken())
      .from("merchants")
      .select("id,name,slug,description,category,city,website,logo_url")
      .eq("status", "verified")
      .order("name")
      .limit(take);
    if (city) q = q.eq("city", city);
    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);

    const stores = ((data ?? []) as unknown as StoreRow[]).map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      category: s.category,
      city: s.city,
      website: s.website,
      logoUrl: s.logo_url,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: stores.length ? stores.map((s) => `${s.name} — ${s.city ?? "غير محدد"}`).join("\n") : "لا توجد متاجر موثّقة.",
        },
      ],
      structuredContent: { stores },
    };
  },
});
