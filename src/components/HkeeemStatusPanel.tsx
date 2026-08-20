import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { getHkeeemIntegrationStatus } from "@/lib/hkeeem-offers.functions";

function formatAr(value: string | null) {
  if (!value) return "لا يوجد";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "لا يوجد";
  return d.toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

/** لوحة حالة تكامل HkeeemAI — بيانات تشغيلية فقط، بلا أي مفاتيح أو أسرار */
export function HkeeemStatusPanel({ refreshKey }: { refreshKey?: unknown }) {
  const fetchStatus = useServerFn(getHkeeemIntegrationStatus);
  const { data, isPending } = useQuery({
    queryKey: ["hkeeem-status", refreshKey],
    queryFn: () => fetchStatus({}),
  });

  return (
    <div
      dir="rtl"
      className="rounded-3xl border border-border bg-card p-4 space-y-2"
      aria-label="حالة تكامل HkeeemAI"
    >
      <h3 className="font-display font-black text-sm flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" /> حالة تكامل HkeeemAI
      </h3>

      {isPending || !data ? (
        <div className="h-10 bg-muted rounded animate-pulse" aria-busy="true" />
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-2xl bg-muted/50 p-2">
            <dt className="text-muted-foreground">الإعداد</dt>
            <dd className="font-bold">{data.configured ? "مفتاح التكامل مُهيّأ" : "غير مُهيّأ"}</dd>
          </div>
          <div className="rounded-2xl bg-muted/50 p-2">
            <dt className="text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-primary" /> آخر نجاح
            </dt>
            <dd className="font-bold">{formatAr(data.lastSuccessAt)}</dd>
            {data.lastSuccessCount !== null && (
              <dd className="text-muted-foreground">{data.lastSuccessCount} عنصر</dd>
            )}
          </div>
          <div className="rounded-2xl bg-muted/50 p-2">
            <dt className="text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-destructive" /> آخر فشل
            </dt>
            <dd className="font-bold">{formatAr(data.lastFailureAt)}</dd>
            {data.lastFailureReason && (
              <dd className="text-muted-foreground">
                {data.lastFailureReason}
                {data.lastFailureStatus !== null ? ` (${data.lastFailureStatus})` : ""}
              </dd>
            )}
          </div>
        </dl>
      )}
    </div>
  );
}
