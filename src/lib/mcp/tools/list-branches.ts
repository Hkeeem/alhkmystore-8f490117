import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller } from "../supabase";

interface BranchRow {
  id: string;
  store_name: string;
  name: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  hours: string | null;
  maps_url: string | null;
}

export default defineTool({
  name: "list_store_branches",
  title: "فروع المتاجر بمواقع محفوظة",
  description: "يعرض فروع المتاجر النشطة التي لها إحداثيات محفوظة وموثّقة فقط.",
  inputSchema: {
    city: z.string().trim().optional().describe("تصفية بالمدينة"),
    store_name: z.string().trim().optional().describe("اسم المتجر"),
    limit: z.number().int().optional().describe("عدد النتائج، الحد الأقصى 50"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, store_name, limit }, ctx) => {
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    let q = supabaseForCaller(ctx.getToken())
      .from("store_branches")
      .select("id,store_name,name,city,district,address,lat,lng,phone,hours,maps_url")
      .eq("is_active", true)
      .not("lat", "is", null)
      .not("lng", "is", null)
      .order("store_name")
      .limit(take);
    if (city) q = q.eq("city", city);
    if (store_name) q = q.ilike("store_name", `%${store_name}%`);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);

    const branches = ((data ?? []) as unknown as BranchRow[]).map((b) => ({
      id: b.id,
      storeName: b.store_name,
      branchName: b.name,
      city: b.city,
      district: b.district,
      address: b.address,
      lat: b.lat,
      lng: b.lng,
      phone: b.phone,
      hours: b.hours,
      mapsUrl: b.maps_url,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: branches.length
            ? branches.map((b) => `${b.storeName} ${b.branchName ?? ""} — ${b.city ?? ""}`).join("\n")
            : "لا توجد فروع بمواقع محفوظة.",
        },
      ],
      structuredContent: { branches },
    };
  },
});
