/**
 * إشعارات بريدية تلقائية عند هبوط الفهرسة أو زحف Google (تحذير / حرِج).
 * تُستدعى من مهمة اللقطات المجدولة بعد كل تحديث ناجح.
 */

const COOLDOWN_HOURS = 12;
const AUDIT_ACTION = "search_console_drop_email";

export type DropAlert = {
  metric: string;
  label: string;
  current: number;
  baseline: number;
  delta: number;
  percent: number;
  severity: "critical" | "warning";
  message: string;
};

/** حساب تنبيهات الهبوط بمقارنة متوسط آخر 24 ساعة بالـ24 ساعة السابقة */
export async function computeDropAlerts(): Promise<DropAlert[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("search_console_snapshots")
    .select("indexed, indexed_urls, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const now = Date.now();
  const at = (r: { created_at: string }) => new Date(r.created_at).getTime();
  const window24 = rows.filter((r) => now - at(r) <= 24 * 60 * 60 * 1000);
  const window48 = rows.filter((r) => {
    const age = now - at(r);
    return age > 24 * 60 * 60 * 1000 && age <= 48 * 60 * 60 * 1000;
  });

  const avg = (list: typeof rows, key: "indexed" | "indexed_urls") =>
    list.length ? list.reduce((s, r) => s + (r[key] ?? 0), 0) / list.length : null;

  const metrics = [
    { key: "indexed_urls" as const, label: "الصفحات المراقبة المفهرسة" },
    { key: "indexed" as const, label: "روابط مفهرسة عبر خريطة الموقع (زحف Google)" },
  ];

  const alerts: DropAlert[] = [];
  for (const m of metrics) {
    const current = avg(window24, m.key);
    const baseline = avg(window48, m.key);
    if (current === null || baseline === null || baseline <= 0) continue;
    const delta = Math.round((current - baseline) * 10) / 10;
    const percent = Math.round(((current - baseline) / baseline) * 1000) / 10;
    if (percent > -10 && delta > -2) continue;
    alerts.push({
      metric: m.key,
      label: m.label,
      current: Math.round(current * 10) / 10,
      baseline: Math.round(baseline * 10) / 10,
      delta,
      percent,
      severity: percent <= -25 ? "critical" : "warning",
      message: `انخفض ${m.label} بنسبة ${Math.abs(percent)}% (${Math.abs(delta)}) خلال آخر 24 ساعة مقارنةً بالـ24 ساعة التي سبقتها.`,
    });
  }
  return alerts;
}

/**
 * إرسال بريد للفريق عند وجود تنبيه تحذير أو حرِج، مع فترة تهدئة
 * لمنع تكرار نفس التنبيه أكثر من مرة كل 12 ساعة.
 */
export async function notifyDropAlertsByEmail(
  siteUrl?: string | null,
): Promise<{ status: string; alerts: number }> {
  const alerts = await computeDropAlerts();
  if (alerts.length === 0) return { status: "no_alerts", alerts: 0 };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const signature = alerts
    .map((a) => `${a.metric}:${a.severity}`)
    .sort()
    .join("|");

  // فترة التهدئة: لا نكرر نفس التركيبة خلال 12 ساعة
  const cooldownSince = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from("admin_audit_log")
    .select("meta, created_at")
    .eq("action", AUDIT_ACTION)
    .gte("created_at", cooldownSince)
    .order("created_at", { ascending: false })
    .limit(5);
  if ((recent ?? []).some((r) => (r.meta as { signature?: string } | null)?.signature === signature)) {
    return { status: "cooldown", alerts: alerts.length };
  }

  const { data: recipientRows } = await supabaseAdmin
    .from("report_recipients")
    .select("email")
    .eq("active", true);
  const emails = (recipientRows ?? []).map((r) => r.email as string).filter(Boolean);
  if (!emails.length) return { status: "no_recipients", alerts: alerts.length };

  const critical = alerts.some((a) => a.severity === "critical");
  const subject = `[حكيم AI] ${critical ? "تنبيه حرِج" : "تحذير"} — هبوط في الفهرسة`;
  const rowsHtml = alerts
    .map(
      (a) => `<li style="margin-bottom:10px">
        <strong>${a.severity === "critical" ? "حرِج" : "تحذير"} — ${a.label}</strong><br/>
        ${a.message}<br/>
        <span style="color:#666;font-size:13px">الحالي: ${a.current} — المرجع: ${a.baseline}</span>
      </li>`,
    )
    .join("");
  const html = `<div dir="rtl" style="font-family:system-ui,sans-serif">
    <h2 style="color:${critical ? "#b42318" : "#b54708"};margin:0 0 8px">${subject}</h2>
    ${siteUrl ? `<p style="font-size:13px;color:#666">الموقع: ${siteUrl}</p>` : ""}
    <ul style="font-size:15px;line-height:1.8;padding-inline-start:18px">${rowsHtml}</ul>
    <p style="font-size:13px;color:#666">افتح لوحة Search Console داخل حكيم AI لمراجعة التفاصيل والرسوم البيانية.</p>
  </div>`;
  const text = alerts.map((a) => `- ${a.label}: ${a.message}`).join("\n");

  try {
    const { sendReportEmail } = await import("@/lib/weekly-report.server");
    await sendReportEmail(emails, subject, html, text);
  } catch (error) {
    console.error("search console drop email failed", error);
    return { status: "failed", alerts: alerts.length };
  }

  await supabaseAdmin.from("admin_audit_log").insert({
    action: AUDIT_ACTION,
    target_table: "search_console_snapshots",
    meta: { signature, alerts, recipients: emails.length, siteUrl: siteUrl ?? null },
  });

  return { status: `sent:${emails.length}`, alerts: alerts.length };
}
