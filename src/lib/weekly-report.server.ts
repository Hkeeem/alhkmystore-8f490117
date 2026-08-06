/**
 * التقرير الأسبوعي التلقائي:
 * - يحسب ملخص الأداء لنطاق الفترة المحدد ويقارنه بالفترة السابقة المماثلة.
 * - يبني رسالة HTML عربية (RTL) ويرسلها لمستلمي التقارير عبر بوابة Resend.
 */

export type Metric = {
  key: string;
  label: string;
  current: number;
  previous: number;
  change: number; // نسبة التغير %
  format: "number" | "currency";
};

export type ReportSummary = {
  periodStart: string;
  periodEnd: string;
  prevStart: string;
  prevEnd: string;
  days: number;
  metrics: Array<Metric>;
  topDeals: Array<{ title: string; clicks: number; conversions: number; commission: number }>;
  topCountries: Array<{ key: string; clicks: number }>;
};

const DAY = 24 * 60 * 60 * 1000;

const pct = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const tally = (items: Array<string>) => {
  const map = new Map<string, number>();
  for (const i of items) map.set(i, (map.get(i) ?? 0) + 1);
  return [...map.entries()].map(([key, clicks]) => ({ key, clicks })).sort((a, b) => b.clicks - a.clicks);
};

export async function buildWeeklyReport(days = 7, endAt = new Date()): Promise<ReportSummary> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const end = endAt;
  const start = new Date(end.getTime() - days * DAY);
  const prevEnd = start;
  const prevStart = new Date(start.getTime() - days * DAY);

  const [clicksRes, convRes, dealsRes, merchantDealsRes, usersRes, alertsRes] = await Promise.all([
    supabaseAdmin
      .from("affiliate_clicks")
      .select("deal_id, country, created_at")
      .gte("created_at", prevStart.toISOString())
      .lt("created_at", end.toISOString())
      .limit(20000),
    supabaseAdmin
      .from("affiliate_conversions")
      .select("click_id, deal_id, amount, commission, status, created_at")
      .gte("created_at", prevStart.toISOString())
      .lt("created_at", end.toISOString())
      .limit(20000),
    supabaseAdmin
      .from("external_deals")
      .select("id, title, created_at")
      .gte("created_at", prevStart.toISOString())
      .lt("created_at", end.toISOString())
      .limit(20000),
    supabaseAdmin
      .from("merchant_deals")
      .select("id, title, status, created_at")
      .gte("created_at", prevStart.toISOString())
      .lt("created_at", end.toISOString())
      .limit(20000),
    supabaseAdmin
      .from("profiles")
      .select("id, created_at")
      .gte("created_at", prevStart.toISOString())
      .lt("created_at", end.toISOString())
      .limit(20000),
    supabaseAdmin
      .from("price_alerts")
      .select("id, created_at")
      .gte("created_at", prevStart.toISOString())
      .lt("created_at", end.toISOString())
      .limit(20000),
  ]);

  const inCurrent = (ts: string | null) => !!ts && new Date(ts) >= start;
  const split = <T extends { created_at: string | null }>(rows: Array<T> | null) => {
    const all = rows ?? [];
    return { cur: all.filter((r) => inCurrent(r.created_at)), prev: all.filter((r) => !inCurrent(r.created_at)) };
  };

  const clicks = split(clicksRes.data as Array<{ created_at: string; deal_id: string; country: string | null }> | null);
  const conv = split(
    convRes.data as Array<{ created_at: string; deal_id: string | null; amount: number | null; commission: number | null; status: string | null }> | null,
  );
  const deals = split(dealsRes.data as Array<{ created_at: string; title: string | null }> | null);
  const mDeals = split(merchantDealsRes.data as Array<{ created_at: string; status: string | null }> | null);
  const users = split(usersRes.data as Array<{ created_at: string }> | null);
  const alerts = split(alertsRes.data as Array<{ created_at: string }> | null);

  const sum = (rows: Array<{ commission: number | null }>) =>
    Math.round(rows.reduce((t, r) => t + Number(r.commission ?? 0), 0) * 100) / 100;
  const sumAmount = (rows: Array<{ amount: number | null }>) =>
    Math.round(rows.reduce((t, r) => t + Number(r.amount ?? 0), 0) * 100) / 100;

  const metric = (key: string, label: string, current: number, previous: number, format: Metric["format"] = "number"): Metric => ({
    key, label, current, previous, change: pct(current, previous), format,
  });

  const cr = (c: number, k: number) => (k === 0 ? 0 : Math.round((c / k) * 1000) / 10);

  const metrics: Array<Metric> = [
    metric("clicks", "النقرات على العروض", clicks.cur.length, clicks.prev.length),
    metric("conversions", "التحويلات المؤكدة", conv.cur.length, conv.prev.length),
    metric("commission", "العمولات", sum(conv.cur), sum(conv.prev), "currency"),
    metric("sales", "قيمة المبيعات", sumAmount(conv.cur), sumAmount(conv.prev), "currency"),
    metric("cr", "معدل التحويل %", cr(conv.cur.length, clicks.cur.length), cr(conv.prev.length, clicks.prev.length)),
    metric("deals", "عروض خارجية جديدة", deals.cur.length, deals.prev.length),
    metric("merchant_deals", "عروض التجار الجديدة", mDeals.cur.length, mDeals.prev.length),
    metric("users", "مستخدمون جدد", users.cur.length, users.prev.length),
    metric("alerts", "تنبيهات أسعار جديدة", alerts.cur.length, alerts.prev.length),
  ];

  // أفضل العروض بحسب النقرات خلال الفترة الحالية
  const byDeal = new Map<string, { clicks: number; conversions: number; commission: number }>();
  for (const c of clicks.cur) {
    const row = byDeal.get(c.deal_id) ?? { clicks: 0, conversions: 0, commission: 0 };
    row.clicks += 1;
    byDeal.set(c.deal_id, row);
  }
  for (const c of conv.cur) {
    if (!c.deal_id) continue;
    const row = byDeal.get(c.deal_id) ?? { clicks: 0, conversions: 0, commission: 0 };
    row.conversions += 1;
    row.commission += Number(c.commission ?? 0);
    byDeal.set(c.deal_id, row);
  }
  const topIds = [...byDeal.entries()].sort((a, b) => b[1].clicks - a[1].clicks).slice(0, 5);
  let titles = new Map<string, string>();
  if (topIds.length) {
    const { data: dealRows } = await supabaseAdmin
      .from("external_deals")
      .select("id, title")
      .in("id", topIds.map(([id]) => id));
    titles = new Map((dealRows ?? []).map((d) => [d.id as string, (d.title as string) ?? ""]));
  }

  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    prevStart: prevStart.toISOString(),
    prevEnd: prevEnd.toISOString(),
    days,
    metrics,
    topDeals: topIds.map(([id, v]) => ({
      title: titles.get(id) || "عرض غير معروف",
      clicks: v.clicks,
      conversions: v.conversions,
      commission: Math.round(v.commission * 100) / 100,
    })),
    topCountries: tally(clicks.cur.map((c) => c.country || "غير محدد")).slice(0, 5),
  };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });

const fmtValue = (m: Metric) =>
  m.format === "currency"
    ? `${m.current.toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ر.س`
    : m.current.toLocaleString("ar-SA");

const changeChip = (change: number) => {
  const up = change > 0;
  const flat = change === 0;
  const color = flat ? "#8a8a8a" : up ? "#12805c" : "#b3261e";
  const arrow = flat ? "—" : up ? "▲" : "▼";
  return `<span style="color:${color};font-size:13px;white-space:nowrap">${arrow} ${Math.abs(change)}%</span>`;
};

export function renderReportEmail(summary: ReportSummary): { subject: string; html: string; text: string } {
  const rows = summary.metrics
    .map(
      (m) => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee">${m.label}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-weight:700">${fmtValue(m)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#777">${m.previous.toLocaleString("ar-SA")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee">${changeChip(m.change)}</td>
      </tr>`,
    )
    .join("");

  const deals = summary.topDeals.length
    ? summary.topDeals
        .map(
          (d, i) =>
            `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${i + 1}. ${d.title}</td>
             <td style="padding:8px 12px;border-bottom:1px solid #eee">${d.clicks} نقرة</td>
             <td style="padding:8px 12px;border-bottom:1px solid #eee">${d.conversions} تحويل</td></tr>`,
        )
        .join("")
    : `<tr><td style="padding:12px;color:#777">لا توجد بيانات كافية خلال هذه الفترة</td></tr>`;

  const countries = summary.topCountries.length
    ? summary.topCountries.map((c) => `${c.key}: ${c.clicks}`).join(" • ")
    : "لا توجد بيانات";

  const subject = `تقرير حكيم AI — ${fmtDate(summary.periodStart)} إلى ${fmtDate(summary.periodEnd)}`;

  const html = `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#0e0e10;padding:24px;font-family:'Segoe UI',Tahoma,Arial,sans-serif">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1a1a1d,#3a2f10);padding:24px;color:#e9c46a">
        <div style="font-size:20px;font-weight:800">حكيم AI — التقرير الدوري</div>
        <div style="font-size:13px;opacity:.85;margin-top:6px">
          الفترة: ${fmtDate(summary.periodStart)} — ${fmtDate(summary.periodEnd)} (${summary.days} يوم)<br/>
          مقارنة بالفترة السابقة: ${fmtDate(summary.prevStart)} — ${fmtDate(summary.prevEnd)}
        </div>
      </div>
      <div style="padding:20px">
        <table style="width:100%;border-collapse:collapse;font-size:14px" dir="rtl">
          <thead><tr style="background:#faf7ef;text-align:right">
            <th style="padding:10px 12px">المؤشر</th><th style="padding:10px 12px">الفترة الحالية</th>
            <th style="padding:10px 12px">السابقة</th><th style="padding:10px 12px">التغير</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>

        <h3 style="margin:24px 0 8px;font-size:16px">أفضل العروض أداءً</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px" dir="rtl"><tbody>${deals}</tbody></table>

        <h3 style="margin:24px 0 8px;font-size:16px">أعلى الدول</h3>
        <div style="font-size:14px;color:#444">${countries}</div>

        <div style="margin-top:24px;font-size:12px;color:#888">
          هذا تقرير تلقائي من منصة حكيم AI. يمكن تعديل المستلمين ونطاق الفترة من لوحة التحكم.
        </div>
      </div>
    </div>
  </body></html>`;

  const text = [
    subject,
    ...summary.metrics.map((m) => `${m.label}: ${fmtValue(m)} (السابق ${m.previous}، التغير ${m.change}%)`),
  ].join("\n");

  return { subject, html, text };
}

export async function sendReportEmail(
  to: Array<string>,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!resendKey) throw new Error("RESEND_API_KEY is not configured");
  const from = process.env["REPORT_FROM_EMAIL"] || "Hkeeem AI <onboarding@resend.dev>";

  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`report email failed [${res.status}]: ${body}`);
    throw new Error(`فشل إرسال البريد [${res.status}]: ${body}`);
  }
}

export async function runWeeklyReport(options: {
  days?: number;
  triggeredBy?: string;
  testEmail?: string | null;
}): Promise<{ sent: boolean; recipients: number; summary: ReportSummary; error?: string }> {
  const days = Math.min(90, Math.max(1, Math.floor(options.days ?? 7)));
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const summary = await buildWeeklyReport(days);
  const { subject, html, text } = renderReportEmail(summary);

  let recipients: Array<string> = [];
  if (options.testEmail) {
    recipients = [options.testEmail];
  } else {
    const { data } = await supabaseAdmin.from("report_recipients").select("email").eq("active", true);
    recipients = (data ?? []).map((r) => r.email as string);
  }

  const periodStart = summary.periodStart;
  const periodEnd = summary.periodEnd;

  if (!recipients.length) {
    await supabaseAdmin.from("report_runs").insert({
      period_start: periodStart, period_end: periodEnd, days,
      status: "skipped", recipients: 0, error: "لا يوجد مستلمون مفعّلون",
      summary: JSON.parse(JSON.stringify(summary)),
      triggered_by: options.triggeredBy ?? "cron",
    });
    return { sent: false, recipients: 0, summary, error: "لا يوجد مستلمون مفعّلون" };
  }

  try {
    await sendReportEmail(recipients, subject, html, text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabaseAdmin.from("report_runs").insert({
      period_start: periodStart, period_end: periodEnd, days,
      status: "failed", recipients: recipients.length, error: message.slice(0, 800),
      summary: JSON.parse(JSON.stringify(summary)),
      triggered_by: options.triggeredBy ?? "cron",
    });
    return { sent: false, recipients: recipients.length, summary, error: message };
  }

  await supabaseAdmin.from("report_runs").insert({
    period_start: periodStart, period_end: periodEnd, days,
    status: options.testEmail ? "test" : "sent", recipients: recipients.length,
    summary: JSON.parse(JSON.stringify(summary)),
    triggered_by: options.triggeredBy ?? "cron",
  });

  return { sent: true, recipients: recipients.length, summary };
}
