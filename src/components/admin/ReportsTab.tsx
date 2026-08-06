import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Mail, Plus, Trash2, Send, Loader2, RefreshCw, ArrowUp, ArrowDown, Minus, CheckCircle2, XCircle,
} from "lucide-react";
import {
  listReportSettings, addReportRecipient, removeReportRecipient,
  setReportRecipientActive, previewReport, sendReportNow,
} from "@/lib/weekly-report.functions";

const RANGES = [
  { days: 7, label: "أسبوع" },
  { days: 14, label: "أسبوعان" },
  { days: 30, label: "شهر" },
  { days: 90, label: "٣ أشهر" },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });

const STATUS: Record<string, { label: string; cls: string }> = {
  sent: { label: "تم الإرسال", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  test: { label: "اختبار", cls: "bg-primary/15 text-primary border-primary/30" },
  failed: { label: "فشل", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  skipped: { label: "متخطى", cls: "bg-muted text-muted-foreground border-border" },
};

export function ReportsTab() {
  const qc = useQueryClient();
  const [days, setDays] = useState(7);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [testEmail, setTestEmail] = useState("");

  const settingsQ = useQuery({ queryKey: ["report-settings"], queryFn: () => listReportSettings() });
  const previewQ = useQuery({ queryKey: ["report-preview", days], queryFn: () => previewReport({ data: { days } }) });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["report-settings"] });
  };

  const addM = useMutation({
    mutationFn: () => addReportRecipient({ data: { email, name } }),
    onSuccess: () => { setEmail(""); setName(""); toast.success("تمت إضافة المستلم"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeM = useMutation({
    mutationFn: (id: string) => removeReportRecipient({ data: { id } }),
    onSuccess: () => { toast.success("تم الحذف"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleM = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => setReportRecipientActive({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const sendM = useMutation({
    mutationFn: (test: boolean) => sendReportNow({ data: { days, testEmail: test ? testEmail : undefined } }),
    onSuccess: (r) => {
      if (r.sent) toast.success(`تم إرسال التقرير إلى ${r.recipients} مستلم`);
      else toast.error(r.error ?? "تعذّر إرسال التقرير");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const summary = previewQ.data;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-card/60 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-primary" />
          <h2 className="font-bold">التقرير الدوري بالبريد</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          يُرسل تلقائيًا كل يوم أحد الساعة 6 صباحًا ويتضمن ملخص الأداء والتغيّر مقارنة بالفترة السابقة المماثلة.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">نطاق الفترة:</span>
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                days === r.days ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() => previewQ.refetch()}
            className="mr-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted"
          >
            <RefreshCw className={`w-4 h-4 ${previewQ.isFetching ? "animate-spin" : ""}`} /> تحديث المعاينة
          </button>
        </div>
      </div>

      {/* معاينة الملخص */}
      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <h3 className="font-semibold mb-3">معاينة الملخص</h3>
        {previewQ.isLoading || !summary ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحساب…
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {fmtDate(summary.periodStart)} — {fmtDate(summary.periodEnd)} • مقارنة بـ {fmtDate(summary.prevStart)} — {fmtDate(summary.prevEnd)}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.metrics.map((m) => {
                const up = m.change > 0, flat = m.change === 0;
                const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
                const color = flat ? "text-muted-foreground" : up ? "text-emerald-500" : "text-destructive";
                return (
                  <div key={m.key} className="rounded-xl border border-border/60 p-3">
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-bold">
                        {m.current.toLocaleString("ar-SA")}{m.format === "currency" ? " ر.س" : ""}
                      </span>
                      <span className={`text-xs flex items-center gap-0.5 ${color}`}>
                        <Icon className="w-3 h-3" />{Math.abs(m.change)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">السابق: {m.previous.toLocaleString("ar-SA")}</div>
                  </div>
                );
              })}
            </div>
            {summary.topDeals.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">أفضل العروض</h4>
                <ul className="text-sm space-y-1">
                  {summary.topDeals.map((d, i) => (
                    <li key={i} className="flex justify-between gap-3 border-b border-border/40 py-1">
                      <span className="truncate">{d.title}</span>
                      <span className="text-muted-foreground whitespace-nowrap">{d.clicks} نقرة • {d.conversions} تحويل</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* المستلمون */}
      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <h3 className="font-semibold mb-3">المستلمون</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@example.com"
            className="flex-1 min-w-[200px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم (اختياري)"
            className="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={() => addM.mutate()} disabled={!email || addM.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
          >
            {addM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} إضافة
          </button>
        </div>

        {settingsQ.data?.recipients.length ? (
          <ul className="space-y-2">
            {settingsQ.data.recipients.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm">
                <span className="font-medium">{r.email}</span>
                {r.name && <span className="text-muted-foreground text-xs">{r.name}</span>}
                <button
                  onClick={() => toggleM.mutate({ id: r.id, active: !r.active })}
                  className={`mr-auto flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${
                    r.active ? "border-emerald-500/30 text-emerald-500" : "border-border text-muted-foreground"
                  }`}
                >
                  {r.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {r.active ? "مفعّل" : "موقوف"}
                </button>
                <button onClick={() => removeM.mutate(r.id)} className="text-destructive hover:opacity-70">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">لا يوجد مستلمون بعد — أضف بريدًا لبدء استلام التقرير.</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2 items-center border-t border-border/50 pt-4">
          <button
            onClick={() => sendM.mutate(false)} disabled={sendM.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
          >
            {sendM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} إرسال التقرير الآن
          </button>
          <input
            value={testEmail} onChange={(e) => setTestEmail(e.target.value)} type="email" placeholder="بريد اختبار"
            className="w-52 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={() => sendM.mutate(true)} disabled={!testEmail || sendM.isPending}
            className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-50"
          >
            إرسال نسخة اختبار
          </button>
        </div>
      </div>

      {/* السجل */}
      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <h3 className="font-semibold mb-3">سجل الإرسال</h3>
        {settingsQ.data?.runs.length ? (
          <ul className="space-y-2 text-sm">
            {settingsQ.data.runs.map((run) => {
              const s = STATUS[run.status] ?? STATUS.skipped!;
              return (
                <li key={run.id} className="flex flex-wrap items-center gap-2 border-b border-border/40 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-md border ${s.cls}`}>{s.label}</span>
                  <span>{fmtDate(run.period_start)} — {fmtDate(run.period_end)}</span>
                  <span className="text-muted-foreground text-xs">{run.recipients} مستلم • {run.triggered_by.startsWith("manual") ? "يدوي" : "تلقائي"}</span>
                  <span className="mr-auto text-xs text-muted-foreground">{new Date(run.created_at).toLocaleString("ar-SA")}</span>
                  {run.error && <span className="w-full text-xs text-destructive">{run.error}</span>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">لم يُرسل أي تقرير بعد.</p>
        )}
      </div>
    </div>
  );
}
