import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Building2, Clock, Radar, RefreshCw, Ticket, Truck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getBotsStatus, runBotNow, type BotKey, type BotStatus } from "@/lib/bots.functions";
import { StoreBotPanel } from "@/components/admin/StoreBotPanel";

const META: Record<BotKey, { icon: typeof Bot; desc: string }> = {
  shareeti: { icon: Truck, desc: "يجلب عروض المتاجر الإلكترونية السعودية من روابط التغذية." },
  real_estate: {
    icon: Building2,
    desc: "يرصد إعلانات الشركات العقارية والوسطاء ويحدّث أحدث العروض.",
  },
  deals_radar: { icon: Radar, desc: "يمسح المتاجر والوكالات المعروفة ويلتقط أقوى التخفيضات." },
  coupon_hunter: { icon: Ticket, desc: "يبحث عن الكوبونات الفعّالة من المتاجر الشريكة ويتحقق منها." },
};

function cronToArabic(schedule: string | null) {
  if (!schedule) return "غير مجدول";
  const map: Record<string, string> = {
    "15 * * * *": "كل ساعة (الدقيقة 15)",
    "0 * * * *": "كل ساعة",
    "0 */6 * * *": "كل 6 ساعات",
    "20 */6 * * *": "كل 6 ساعات",
    "0 3 * * *": "يوميًا 3 فجرًا",
  };
  return map[schedule] ?? schedule;
}

function fmt(ts: string | null) {
  if (!ts) return "لم يعمل بعد";
  return new Date(ts).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

export function BotsPanel() {
  const qc = useQueryClient();
  const load = useServerFn(getBotsStatus);
  const run = useServerFn(runBotNow);

  const q = useQuery({
    queryKey: ["bots-status"],
    queryFn: () => load({}) as Promise<BotStatus[]>,
    refetchInterval: 60_000,
  });

  const runMutation = useMutation({
    mutationFn: (key: BotKey) => run({ data: { key } }),
    onSuccess: (r: { message: string }) => {
      toast.success(r.message);
      void qc.invalidateQueries({ queryKey: ["bots-status"] });
      void qc.invalidateQueries({ queryKey: ["real-deals"], refetchType: "all" });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "تعذّر تشغيل البوت الآن"),
  });

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" /> البوتات الآلية
        </h2>
        <Button size="sm" variant="outline" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={`ml-1 h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} />
          تحديث الحالة
        </Button>
      </div>

      {q.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : q.isError ? (
        <p className="rounded-lg border p-4 text-sm text-destructive">تعذّر تحميل حالة البوتات.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(q.data ?? []).map((bot) => {
            const meta = META[bot.key] ?? META.deals_radar;
            const Icon = meta.icon;
            const failed = (bot.lastStatus ?? "").toLowerCase().includes("fail");
            return (
              <Card key={bot.key} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      {bot.label}
                    </span>
                    <Badge variant={bot.active ? "default" : "secondary"} className="text-[10px]">
                      {bot.active ? "يعمل" : "متوقف"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{meta.desc}</p>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {cronToArabic(bot.schedule)}
                    </Badge>
                    <Badge className="text-[11px]">{bot.count} صفقة فورية</Badge>
                    <Badge
                      variant={failed ? "destructive" : "secondary"}
                      className="text-[11px]"
                    >
                      آخر تشغيل: {fmt(bot.lastRunAt)}
                    </Badge>
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => runMutation.mutate(bot.key)}
                    disabled={runMutation.isPending}
                  >
                    <RefreshCw
                      className={`ml-1 h-4 w-4 ${runMutation.isPending ? "animate-spin" : ""}`}
                    />
                    تشغيل الآن
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <StoreBotPanel />
    </div>
  );
}
