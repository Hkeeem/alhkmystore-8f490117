import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone, Play, Loader2, RefreshCw, Send, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  getMarketingBots,
  toggleMarketingBot,
  runMarketingBotNow,
  type MarketingBotKey,
} from "@/lib/marketing-bots.functions";
import { listMarketingPosts } from "@/lib/marketing-posts.functions";

const PLATFORM_META: Record<string, { emoji: string; hint: string }> = {
  store_marketing: { emoji: "🛍️", hint: "يرسل أقوى عرض إشعارًا للمشتركين" },
  twitter: { emoji: "🐦", hint: "تغريدة بالعرض الأقوى مع الرابط" },
  instagram: { emoji: "📸", hint: "منشور بصورة العرض (يتطلب صورة)" },
  tiktok: { emoji: "🎵", hint: "نشر عبر صندوق تيك توك" },
  snapchat: { emoji: "👻", hint: "منشور Spotlight على الملف العام" },
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  published: { label: "نُشر", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  pending: { label: "بانتظار ربط المفاتيح", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  failed: { label: "فشل", cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

export function MarketingBotsPanel() {
  const qc = useQueryClient();
  const fetchBots = useServerFn(getMarketingBots);
  const toggleFn = useServerFn(toggleMarketingBot);
  const runFn = useServerFn(runMarketingBotNow);
  const fetchPosts = useServerFn(listMarketingPosts);

  const botsQ = useQuery({
    queryKey: ["marketing-bots"],
    queryFn: () => fetchBots(),
    refetchInterval: 60_000,
  });
  const postsQ = useQuery({ queryKey: ["marketing-posts"], queryFn: () => fetchPosts() });

  const toggle = useMutation({
    mutationFn: (v: { key: MarketingBotKey; enabled: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing-bots"] }),
    onError: () => toast.error("تعذّر تحديث البوت"),
  });

  const run = useMutation({
    mutationFn: (key: MarketingBotKey) => runFn({ data: { key } }),
    onSuccess: (r) => {
      if (r.status === "published") toast.success("تم النشر بنجاح");
      else if (r.status === "pending") toast.info("حُفظ المنشور بانتظار ربط مفاتيح المنصة");
      else toast.error(r.message);
      qc.invalidateQueries({ queryKey: ["marketing-bots"] });
      qc.invalidateQueries({ queryKey: ["marketing-posts"] });
    },
    onError: () => toast.error("تعذّر تشغيل البوت"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            بوتات التسويق
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            تنشر تلقائيًا كل ساعتين بأوقات متفرقة لكل منصة (تُدار من تبويب «مفاتيح النشر»).
          </p>
        </div>
        <button
          onClick={() => {
            botsQ.refetch();
            postsQ.refetch();
          }}
          disabled={botsQ.isFetching}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/25 text-sm hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${botsQ.isFetching ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(botsQ.data ?? []).map((bot) => {
          const meta = PLATFORM_META[bot.key] ?? { emoji: "🤖", hint: "" };
          const busy = run.isPending && run.variables === bot.key;
          return (
            <div key={bot.key} className="p-5 rounded-2xl border border-primary/20 bg-card shadow-card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold flex items-center gap-2">
                    <span>{meta.emoji}</span> {bot.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{meta.hint}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={bot.enabled}
                  onClick={() => toggle.mutate({ key: bot.key as MarketingBotKey, enabled: !bot.enabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    bot.enabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      bot.enabled ? "right-0.5" : "right-[22px]"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> كل ساعتين +{bot.offset_minutes} د
                </span>
                <span>
                  المنشورات: <b className="text-primary">{bot.posts_count}</b>
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-muted-foreground">آخر تشغيل: {fmtDate(bot.last_run_at)}</p>
                <button
                  onClick={() => run.mutate(bot.key as MarketingBotKey)}
                  disabled={busy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  انشر الآن
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-6 space-y-3">
        <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          <Send className="w-4 h-4" />
          آخر المنشورات
        </h3>
        {(postsQ.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">لا منشورات بعد — شغّل أي بوت لتبدأ السجلات.</p>
        )}
        <div className="space-y-2">
          {(postsQ.data ?? []).slice(0, 12).map((p) => {
            const s = STATUS_LABEL[p.status] ?? STATUS_LABEL.failed!;
            return (
              <div
                key={p.id}
                className="p-3 rounded-xl border border-border bg-card/60 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.title ?? p.content.slice(0, 60)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {PLATFORM_META[p.platform]?.emoji ?? ""} {p.platform} · {fmtDate(p.published_at ?? p.created_at)}
                    {p.error ? ` · ${p.error}` : ""}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold shrink-0 ${s.cls}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
