import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ReportSummary } from "@/lib/weekly-report.server";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const parseDays = (data: unknown) => {
  const d = (data ?? {}) as { days?: unknown };
  const days = Number(d.days);
  return { days: Number.isFinite(days) && days > 0 ? Math.min(90, Math.floor(days)) : 7 };
};

async function assertStaff(context: { supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> }; userId: string }) {
  const { data } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (!data) throw new Error("forbidden");
}

export type ReportRecipient = { id: string; email: string; name: string | null; active: boolean };
export type ReportRun = {
  id: string; period_start: string; period_end: string; days: number;
  status: string; recipients: number; error: string | null; triggered_by: string; created_at: string;
};

export const listReportSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ recipients: Array<ReportRecipient>; runs: Array<ReportRun> }> => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: recipients }, { data: runs }] = await Promise.all([
      supabaseAdmin.from("report_recipients").select("id, email, name, active").order("created_at"),
      supabaseAdmin.from("report_runs").select("id, period_start, period_end, days, status, recipients, error, triggered_by, created_at").order("created_at", { ascending: false }).limit(15),
    ]);
    return {
      recipients: (recipients ?? []) as Array<ReportRecipient>,
      runs: (runs ?? []) as Array<ReportRun>,
    };
  });

export const addReportRecipient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string; name?: string }) => {
    const email = String(data?.email ?? "").trim().toLowerCase();
    if (!emailRe.test(email)) throw new Error("بريد غير صالح");
    return { email, name: String(data?.name ?? "").trim().slice(0, 80) || null };
  })
  .handler(async ({ context, data }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("report_recipients")
      .upsert({ email: data.email, name: data.name, active: true }, { onConflict: "email" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setReportRecipientActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; active: boolean }) => ({ id: String(data.id), active: !!data.active }))
  .handler(async ({ context, data }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("report_recipients").update({ active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeReportRecipient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ context, data }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("report_recipients").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const previewReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseDays)
  .handler(async ({ context, data }): Promise<ReportSummary> => {
    await assertStaff(context as never);
    const { buildWeeklyReport } = await import("@/lib/weekly-report.server");
    return buildWeeklyReport(data.days);
  });

export const sendReportNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { days?: number; testEmail?: string }) => {
    const base = parseDays(data);
    const testEmail = String(data?.testEmail ?? "").trim().toLowerCase();
    if (testEmail && !emailRe.test(testEmail)) throw new Error("بريد الاختبار غير صالح");
    return { ...base, testEmail: testEmail || null };
  })
  .handler(async ({ context, data }) => {
    await assertStaff(context as never);
    const { runWeeklyReport } = await import("@/lib/weekly-report.server");
    const result = await runWeeklyReport({
      days: data.days,
      testEmail: data.testEmail,
      triggeredBy: `manual:${context.userId}`,
    });
    return { sent: result.sent, recipients: result.recipients, error: result.error ?? null };
  });
