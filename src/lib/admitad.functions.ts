import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdmitadStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ days: z.number().int().min(1).max(365) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");
    const since = new Date(Date.now() - data.days * 86400000).toISOString();

    const [clicksRes, convRes] = await Promise.all([
      context.supabase
        .from("affiliate_clicks")
        .select("id, created_at")
        .ilike("network", "admitad%")
        .gte("created_at", since)
        .limit(10000),
      context.supabase
        .from("affiliate_conversions")
        .select("id, order_id, status, amount, commission, currency, created_at")
        .ilike("network", "admitad%")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
    if (clicksRes.error) throw new Error(clicksRes.error.message);
    if (convRes.error) throw new Error(convRes.error.message);

    const conversions = convRes.data ?? [];
    const sum = (s?: string) =>
      conversions
        .filter((c) => !s || c.status === s)
        .reduce((a, c) => a + Number(c.commission ?? 0), 0);

    const connected = Boolean(process.env["ADMITAD_CLIENT_ID"] && process.env["ADMITAD_CLIENT_SECRET"]);

    return {
      connected,
      clicks: clicksRes.data?.length ?? 0,
      orders: conversions.length,
      totalCommission: sum(),
      approvedCommission: sum("approved"),
      pendingCommission: sum("pending"),
      recent: conversions.slice(0, 20),
    };
  });
