import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdmitadStats } from "@/lib/admitad.functions";

const PERIODS = [
  { d: 1, l: "اليوم" },
  { d: 7, l: "7 أيام" },
  { d: 30, l: "30 يومًا" },
  { d: 90, l: "90 يومًا" },
];

const STATUS: Record<string, string> = {
  approved: "مقبولة",
  pending: "قيد المراجعة",
  declined: "مرفوضة",
};

const sar = (n: number) => `${n.toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ر.س`;

export function AdmitadPanel() {
  const [days, setDays] = useState(30);
  const fetchStats = useServerFn(getAdmitadStats);
  const q = useQuery({
    queryKey: ["admitad-stats", days],
    queryFn: () => fetchStats({ data: { days } }),
  });
  const s = q.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">عمولات Admitad — متجر حكيم</h2>
          <p className="text-sm text-muted-foreground">النقرات المحوّلة عبر Admitad والعمولات المسجلة.</p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.d}
              onClick={() => setDays(p.d)}
              className={`px-3 py-1.5 rounded-lg text-sm ${days === p.d ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {s && (
        <div
          className={`rounded-xl border p-3 text-sm ${s.connected ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}
        >
          {s.connected
            ? "حساب Admitad مربوط."
            : "حساب Admitad غير مربوط بعد — العمولات تظهر هنا بعد ربط الحساب."}
        </div>
      )}

      {q.isLoading && <p className="text-muted-foreground">جارٍ التحميل…</p>}
      {q.error && <p className="text-destructive">تعذر تحميل البيانات.</p>}

      {s && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "النقرات", v: s.clicks.toLocaleString("ar-SA") },
              { l: "الطلبات", v: s.orders.toLocaleString("ar-SA") },
              { l: "عمولات مقبولة", v: sar(s.approvedCommission) },
              { l: "قيد المراجعة", v: sar(s.pendingCommission) },
            ].map((c) => (
              <div key={c.l} className="rounded-xl border bg-card p-4">
                <div className="text-xs text-muted-foreground">{c.l}</div>
                <div className="text-lg font-bold mt-1">{c.v}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-right">رقم الطلب</th>
                  <th className="p-2 text-right">الحالة</th>
                  <th className="p-2 text-right">قيمة الطلب</th>
                  <th className="p-2 text-right">العمولة</th>
                  <th className="p-2 text-right">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {s.recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      لا توجد عمولات في هذه الفترة.
                    </td>
                  </tr>
                )}
                {s.recent.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.order_id}</td>
                    <td className="p-2">{STATUS[r.status] ?? r.status}</td>
                    <td className="p-2">{sar(Number(r.amount))}</td>
                    <td className="p-2">{sar(Number(r.commission))}</td>
                    <td className="p-2">{new Date(r.created_at).toLocaleDateString("ar-SA")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
