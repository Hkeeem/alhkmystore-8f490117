import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Instagram, Megaphone, Music2, RefreshCw, Send, Store, Twitter } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  getMarketingBots,
  runMarketingBotNow,
  toggleMarketingBot,
  type MarketingBotKey,
  type MarketingBotRow,
  type MarketingPostRow,
} from "@/lib/marketing-bots.functions";

const META: Record<MarketingBotKey, { icon: typeof Store; desc: string }> = {
  store_marketing: { icon: Store, desc: "ينشر أقوى عرض داخل التطبيق كإشعار فوري للمشتركين." },
  twitter: { icon: Twitter, desc: "ينشر تغريدة بأفضل عرض مع الرابط والوسوم." },
  instagram: { icon: Instagram, desc: "ينشر صورة العرض مع وصف ووسوم." },
  tiktok: { icon: Music2, desc: "ينشر منشور صور بالعرض والوصف." },
  snapchat: { icon: Send, desc: "ينشر العرض على الملف العام مع رابط مرفق." },
};

function fmt(ts: string | null) {
  if (!ts) return "لم ينشر بعد";
  return new Date(ts).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

function statusLabel(s: string | null) {
  if (s === "published") return "منشور";
  if (s === "pending") return "بانتظار الربط";
  if (s === "failed") return "فشل";
  if (s === "no_content") return "لا يوجد محتوى جديد";
  return "—";
}

export function MarketingBotsPanel() {
  const qc = useQueryClient();
  const load = useServerFn(getMarketingBots);
  const run = useServerFn(runMarketingBotNow);
  const toggle = useServerFn(toggleMarketingBot);

  const q = useQuery({
    queryKey: ["marketing-bots"],
    queryFn: () => load({}) as Promise<{ bots: MarketingBotRow[]; posts: MarketingPostRow[] }>,
    refetchInterval: 60_000,
  });

  const runMutation = useMutation({
    mutationFn: (key: MarketingBotKey) => run({ data: { key } }),
    onSuccess: (r: { ok: boolean; message: string }) => {
      if (r.ok) toast.success(r.message);
      else toast.warning(r.message);
      void qc.invalidateQueries({ queryKey: ["marketing-bots"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "تعذّر النشر الآن"),
  });

  const toggleMutation = useMutation({
    mutationFn: (v: { key: MarketingBotKey; enabled: boolean }) => toggle({ data: v }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["marketing-bots"] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "تعذّر تغيير الحالة"),
  });

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Megaphone className="h-5 w-5 text-primary" /> بوتات التسويق
        </h2>
        <Button size="sm" variant="outline" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={`ml-1 h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {q.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : q.isError ? (
        <p className="rounded-lg border p-4 text-sm text-destructive">تعذّر تحميل بوتات التسويق.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(q.data?.bots ?? []).map((bot) => {
            const meta = META[bot.key] ?? META.store_marketing;
            const Icon = meta.icon;
            const failed = bot.last_status === "failed";
            return (
              <Card key={bot.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {bot.label}
                    </span>
                    <Switch
                      checked={bot.enabled}
                      onCheckedChange={(enabled) => toggleMutation.mutate({ key: bot.key, enabled })}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{meta.desc}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      كل ساعتين — الدقيقة {bot.offset_minutes}
                    </Badge>
                    <Badge className="text-[11px]">{bot.posts_count} منشور</Badge>
                    <Badge variant={failed ? "destructive" : "secondary"} className="text-[11px]">
                      {statusLabel(bot.last_status)} · {fmt(bot.last_run_at)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => runMutation.mutate(bot.key)}
                    disabled={runMutation.isPending}
                  >
                    <Send className="ml-1 h-4 w-4" /> انشر الآن
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">آخر المنشورات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(q.data?.posts ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد منشورات بعد.</p>
          ) : (
            (q.data?.posts ?? []).map((p) => (
              <div key={p.id} className="rounded-lg border p-3 text-xs">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {p.platform}
                  </Badge>
                  <Badge
                    variant={p.status === "published" ? "default" : p.status === "failed" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {statusLabel(p.status)}
                  </Badge>
                  <span className="text-muted-foreground">{fmt(p.created_at)}</span>
                </div>
                <p className="whitespace-pre-line text-foreground/90">{p.content}</p>
                {p.error ? <p className="mt-1 text-destructive">{p.error}</p> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
