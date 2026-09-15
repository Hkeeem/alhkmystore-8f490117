import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Play, RefreshCw, Loader2, Clock, Database } from "lucide-react";
import { toast } from "sonner";
import { getBotsStatus, runBotNow, type BotKey } from "@/lib/bots.functions";
import { StoreBotPanel } from "@/components/admin/StoreBotPanel";

const BOT_META: Record<string, { emoji: string; desc: string }> = {
  shareeti: { emoji: "🛒", desc: "يجمع عروض المتاجر من الخلاصات المربوطة" },
  real_estate: { emoji: "🏠", desc: "يسحب أحدث العروض العقارية من حراج" },
  deals_radar: { emoji: "📡", desc: "يرصد عروض أمازون ونون ويحدّث الأسعار" },
  coupon_hunter: { emoji: "🎟️", desc: "يصيد الكوبونات الفعّالة من المتاجر الشريكة" },
};

function fmtDate(value: string | null) {
  if (!value) return "لم يعمل بعد";
  return new Date(value).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

export function BotsPanel() {
  const qc = useQueryClient();
  const fetchStatus = useServerFn(getBotsStatus);
  const runNow = useServerFn(runBotNow);

  const q = useQuery({
    queryKey: ["bots-status"],
    queryFn: () => fetchStatus(),
    refetchInterval: 60_000,
  });

  const run = useMutation({
    mutationFn: (key: BotKey) => runNow({ data: { key } }),
    onSuccess: (r) => {
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
      qc.invalidateQueries({ queryKey: ["bots-status"] });
    },
    onError: () => toast.error("تعذّر تشغيل البوت"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          البوتات الآلية
        </h2>
        <button
          onClick={() => q.refetch()}
          disabled={q.isFetching}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/25 text-sm hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${q.isFetching ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {(q.data ?? []).map((bot) => {
          const meta = BOT_META[bot.key] ?? { emoji: "🤖", desc: "" };
          const busy = run.isPending && run.variables === bot.key;
          return (
            <div
              key={bot.key}
              className="p-5 rounded-2xl border border-primary/20 bg-card shadow-card space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold flex items-center gap-2">
                    <span>{meta.emoji}</span> {bot.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{meta.desc}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    bot.active
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {bot.active ? "مجدول" : bot.exists ? "متوقف" : "غير مُجدول"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  الموعد: <span className="font-mono text-foreground">{bot.schedule ?? "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Database className="w-3.5 h-3.5" />
                  الصفقات: <span className="font-bold text-primary">{bot.count}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-muted-foreground">
                  آخر تشغيل: {fmtDate(bot.lastRunAt)}
                  {bot.lastStatus ? ` (${bot.lastStatus === "succeeded" ? "نجح" : "فشل"})` : ""}
                </p>
                <button
                  onClick={() => run.mutate(bot.key as BotKey)}
                  disabled={busy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  تشغيل الآن
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {q.error && (
        <p className="text-sm text-destructive">تعذّر جلب حالة البوتات — تأكد من صلاحياتك.</p>
      )}

      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-bold mb-3 text-muted-foreground">خلاصات بوت المتاجر (الشريطي)</h3>
        <StoreBotPanel />
      </div>
    </div>
  );
}
