import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Megaphone, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getMarketingBots,
  runMarketingBotNow,
  toggleMarketingBot,
  type MarketingBotRow,
} from "@/lib/marketing-bots.functions";
import { listMarketingPosts, type MarketingPostRow } from "@/lib/marketing-posts.functions";

const STATUS_LABEL: Record<string, string> = {
  published: "نُشر",
  pending: "بانتظار المفاتيح",
  failed: "فشل",
  skipped: "لا جديد",
};

function formatTime(value: string | null): string {
  if (!value) return "لم يُشغَّل بعد";
  return new Date(value).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

export function MarketingBotsPanel() {
  const qc = useQueryClient();
  const fetchBots = useServerFn(getMarketingBots);
  const fetchPosts = useServerFn(listMarketingPosts);
  const runNow = useServerFn(runMarketingBotNow);
  const toggle = useServerFn(toggleMarketingBot);

  const bots = useQuery({
    queryKey: ["marketing-bots"],
    queryFn: () => fetchBots() as Promise<MarketingBotRow[]>,
    refetchInterval: 60_000,
  });
  const posts = useQuery({
    queryKey: ["marketing-posts"],
    queryFn: () => fetchPosts() as Promise<MarketingPostRow[]>,
    refetchInterval: 60_000,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["marketing-bots"] });
    void qc.invalidateQueries({ queryKey: ["marketing-posts"] });
  };

  const runMutation = useMutation({
    mutationFn: (key: string) => runNow({ data: { key } }),
    onSuccess: (res) => {
      if (res.status === "published") toast.success("تم النشر بنجاح");
      else if (res.status === "pending") toast.warning(res.message);
      else if (res.status === "skipped") toast.info(res.message);
      else toast.error(res.message);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (v: { key: string; enabled: boolean }) => toggle({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div dir="rtl" className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        خمسة بوتات تنشر أقوى عرض متاح كل ساعتين، كل واحد في دقيقة مختلفة حتى لا تتزاحم المنشورات.
        إذا ظهرت «بانتظار المفاتيح» فأضف مفاتيح تلك المنصة من تبويب «مفاتيح النشر».
      </p>

      {bots.isLoading && <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>}

      <div className="grid sm:grid-cols-2 gap-3">
        {(bots.data ?? []).map((b) => (
          <Card key={b.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  {b.label}
                </span>
                <Badge variant={b.enabled ? "default" : "outline"} className="text-[10px]">
                  {b.enabled ? "مفعّل" : "موقوف"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[12px] text-muted-foreground">
                كل ساعتين · الدقيقة {b.offset_minutes} · منشورات: {b.posts_count}
              </p>
              <p className="text-[12px] text-muted-foreground">
                آخر تشغيل: {formatTime(b.last_run_at)}
                {b.last_status ? ` • ${STATUS_LABEL[b.last_status] ?? b.last_status}` : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => runMutation.mutate(b.key)}
                  disabled={runMutation.isPending}
                >
                  {runMutation.isPending && runMutation.variables === b.key ? (
                    <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 ml-1" />
                  )}
                  انشر الآن
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleMutation.mutate({ key: b.key, enabled: !b.enabled })}
                >
                  {b.enabled ? "إيقاف" : "تفعيل"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">آخر المنشورات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(posts.data ?? []).length === 0 && (
            <p className="text-[12px] text-muted-foreground">لا توجد منشورات بعد.</p>
          )}
          {(posts.data ?? []).map((p) => (
            <div key={p.id} className="border border-border/60 rounded-xl p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold truncate">{p.title ?? p.platform}</span>
                <Badge variant="outline" className="text-[10px]">
                  {p.platform} • {STATUS_LABEL[p.status] ?? p.status}
                </Badge>
              </div>
              <p className="text-[12px] text-muted-foreground whitespace-pre-line line-clamp-3">
                {p.content}
              </p>
              {p.error && <p className="text-[11px] text-destructive">{p.error}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
