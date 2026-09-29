import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PeriodRow = {
  key: string;
  amazonClicks: number;
  admitadClicks: number;
  amazonOrders: number;
  admitadOrders: number;
  amazonCommission: number;
  admitadCommission: number;
  sales: number;
};

const net = (n: string | null) => {
  const v = (n ?? "").toLowerCase();
  if (v.startsWith("amazon")) return "amazon" as const;
  if (v.startsWith("admitad")) return "admitad" as const;
  return null;
};

export const getCommissionReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ year: z.number().int().min(2020).max(2100) }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: a }, { data: s }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
    ]);
    if (!a && !s) throw new Error("forbidden");

    const since = new Date(Date.UTC(data.year - 4, 0, 1)).toISOString();
    const [clicksRes, convRes] = await Promise.all([
      context.supabase
        .from("affiliate_clicks")
        .select("network, created_at")
        .gte("created_at", since)
        .limit(50000),
      context.supabase
        .from("affiliate_conversions")
        .select("network, status, amount, commission, created_at")
        .gte("created_at", since)
        .limit(20000),
    ]);
    if (clicksRes.error) throw new Error(clicksRes.error.message);
    if (convRes.error) throw new Error(convRes.error.message);

    const blank = (key: string): PeriodRow => ({
      key, amazonClicks: 0, admitadClicks: 0, amazonOrders: 0, admitadOrders: 0,
      amazonCommission: 0, admitadCommission: 0, sales: 0,
    });
    const months = new Map<string, PeriodRow>();
    for (let m = 1; m <= 12; m++) {
      const k = `${data.year}-${String(m).padStart(2, "0")}`;
      months.set(k, blank(k));
    }
    const years = new Map<string, PeriodRow>();
    for (let y = data.year - 4; y <= data.year; y++) years.set(String(y), blank(String(y)));

    for (const c of clicksRes.data ?? []) {
      const n = net(c.network);
      if (!n) continue;
      const d = String(c.created_at);
      for (const r of [months.get(d.slice(0, 7)), years.get(d.slice(0, 4))]) {
        if (r) r[n === "amazon" ? "amazonClicks" : "admitadClicks"]++;
      }
    }
    let pending = 0, approved = 0, declined = 0;
    for (const c of convRes.data ?? []) {
      const n = net(c.network);
      if (!n) continue;
      const d = String(c.created_at);
      const com = Number(c.commission ?? 0);
      if (d.startsWith(String(data.year))) {
        if (c.status === "approved") approved += com;
        else if (c.status === "declined") declined += com;
        else pending += com;
      }
      if (c.status === "declined") continue;
      for (const r of [months.get(d.slice(0, 7)), years.get(d.slice(0, 4))]) {
        if (!r) continue;
        if (n === "amazon") { r.amazonOrders++; r.amazonCommission += com; }
        else { r.admitadOrders++; r.admitadCommission += com; }
        r.sales += Number(c.amount ?? 0);
      }
    }
    return {
      monthly: [...months.values()],
      yearly: [...years.values()],
      status: { approved, pending, declined },
      admitadConnected: Boolean(process.env["ADMITAD_CLIENT_ID"] && process.env["ADMITAD_CLIENT_SECRET"]),
      amazonConnected: Boolean(process.env["AMAZON_ACCESS_KEY"] && process.env["AMAZON_SECRET_KEY"]),
    };
  });
