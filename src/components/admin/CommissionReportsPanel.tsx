import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCommissionReport, type PeriodRow } from "@/lib/commission-reports.functions";

const sar = (n: number) => `${n.toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ر.س`;
const num = (n: number) => n.toLocaleString("ar-SA");
const monthName = (k: string) =>
  new Date(`${k}-01T00:00:00Z`).toLocaleDateString("ar-SA", { month: "long", calendar: "gregory" });

function Table({ rows, label }: { rows: PeriodRow[]; label: (k: string) => string }) {
  const t = rows.reduce(
    (a, r) => ({
      ...a,
      amazonClicks: a.amazonClicks + r.amazonClicks,
      admitadClicks: a.admitadClicks + r.admitadClicks,
      amazonOrders: a.amazonOrders + r.amazonOrders,
      admitadOrders: a.admitadOrders + r.admitadOrders,
      amazonCommission: a.amazonCommission + r.amazonCommission,
      admitadCommission: a.admitadCommission + r.admitadCommission,
      sales: a.sales + r.sales,
    }),
    { key: "total", amazonClicks: 0, admitadClicks: 0, amazonOrders: 0, admitadOrders: 0, amazonCommission: 0, admitadCommission: 0, sales: 0 },
  );
  const Row = ({ r, name, bold }: { r: PeriodRow; name: string; bold?: boolean }) => (
    <tr className={`border-b border-border/40 ${bold ? "font-bold bg-muted/40" : ""}`}>
      <td className="p-2">{name}</td>
      <td className="p-2">{num(r.amazonClicks)}</td>
      <td className="p-2">{num(r.amazonOrders)}</td>
      <td className="p-2">{sar(r.amazonCommission)}</td>
      <td className="p-2">{num(r.admitadClicks)}</td>
      <td className="p-2">{num(r.admitadOrders)}</td>
      <td className="p-2">{sar(r.admitadCommission)}</td>
      <td className="p-2 text-primary">{sar(r.amazonCommission + r.admitadCommission)}</td>
    </tr>
  );
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm text-right whitespace-nowrap">
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            <th className="p-2">الفترة</th>
            <th className="p-2">نقرات أمازون</th>
            <th className="p-2">طلبات أمازون</th>
            <th className="p-2">عمولة أمازون</th>
            <th className="p-2">نقرات Admitad</th>
            <th className="p-2">طلبات Admitad</th>
            <th className="p-2">عمولة Admitad</th>
            <th className="p-2">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => <Row key={r.key} r={r} name={label(r.key)} />)}
          <Row r={t} name="المجموع" bold />
        </tbody>
      </table>
    </div>
  );
}

export function CommissionReportsPanel() {
  const now = new Date().getFullYear();
  const [year, setYear] = useState(now);
  const [view, setView] = useState<"monthly" | "yearly">("monthly");
  const fetchReport = useServerFn(getCommissionReport);
  const q = useQuery({ queryKey: ["commission-report", year], queryFn: () => fetchReport({ data: { year } }) });
  const d = q.data;
  const max = d ? Math.max(1, ...d.monthly.map((m) => m.amazonCommission + m.admitadCommission)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">تقارير العمولات — أمازون وAdmitad</h2>
          <p className="text-sm text-muted-foreground">النقرات والطلبات والعمولات شهريًا وسنويًا (المرفوضة مستبعدة).</p>
        </div>
        <div className="flex gap-2">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
            {Array.from({ length: 5 }, (_, i) => now - i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {(["monthly", "yearly"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-sm border ${view === v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {v === "monthly" ? "شهري" : "سنوي"}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading && <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>}
      {q.error && <p className="text-sm text-destructive">تعذّر تحميل التقرير.</p>}

      {d && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { l: "عمولة أمازون (السنة)", v: sar(d.monthly.reduce((a, m) => a + m.amazonCommission, 0)) },
              { l: "عمولة Admitad (السنة)", v: sar(d.monthly.reduce((a, m) => a + m.admitadCommission, 0)) },
              { l: "مقبولة", v: sar(d.status.approved) },
              { l: "قيد المراجعة", v: sar(d.status.pending) },
            ].map((c) => (
              <div key={c.l} className="rounded-xl border border-border bg-card/60 p-3">
                <div className="text-xs text-muted-foreground">{c.l}</div>
                <div className="text-lg font-bold mt-1">{c.v}</div>
              </div>
            ))}
          </div>

          {(!d.amazonConnected || !d.admitadConnected) && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              النقرات تُسجَّل تلقائيًا. العمولات تظهر عند وصولها من الشبكة
              {!d.amazonConnected && " — أمازون غير مربوط بعد"}
              {!d.admitadConnected && " — Admitad غير مربوط بعد"}.
            </div>
          )}

          {view === "monthly" && (
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <div className="flex items-end gap-1 h-32">
                {d.monthly.map((m) => {
                  const am = (m.amazonCommission / max) * 100, ad = (m.admitadCommission / max) * 100;
                  return (
                    <div key={m.key} className="flex-1 flex flex-col justify-end items-center gap-0.5" title={`${monthName(m.key)}: ${sar(m.amazonCommission + m.admitadCommission)}`}>
                      <div className="w-full bg-accent rounded-t" style={{ height: `${ad}%` }} />
                      <div className="w-full bg-primary" style={{ height: `${am}%` }} />
                      <span className="text-[9px] text-muted-foreground">{Number(m.key.slice(5))}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 text-xs mt-2 text-muted-foreground">
                <span className="flex items-center gap-1"><i className="w-3 h-3 bg-primary rounded-sm" /> أمازون</span>
                <span className="flex items-center gap-1"><i className="w-3 h-3 bg-accent rounded-sm" /> Admitad</span>
              </div>
            </div>
          )}

          {view === "monthly" ? <Table rows={d.monthly} label={monthName} /> : <Table rows={d.yearly} label={(k) => k} />}
        </>
      )}
    </div>
  );
}
