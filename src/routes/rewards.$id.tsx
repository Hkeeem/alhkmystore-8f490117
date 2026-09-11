import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Gift, Sparkles, Check, CheckCircle2, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  REWARDS_CATALOG,
  loadRewards,
  redeemReward,
  type RewardItem,
  type RewardState,
} from "@/lib/rewards";
import { ShareSheet } from "@/components/ShareSheet";
import { InvalidLinkFallback } from "@/components/InvalidLinkFallback";

export const Route = createFileRoute("/rewards/$id")({
  loader: ({ params }) => {
    const reward = REWARDS_CATALOG.find((r) => r.id === params.id);
    if (!reward) throw notFound();
    return { reward };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "الجائزة غير متوفرة — وفّر" }, { name: "robots", content: "noindex" }],
      };
    }
    const r = loaderData.reward;
    return {
      meta: [
        { title: `${r.title} — استبدل بـ ${r.cost} نقطة — وفّر` },
        { name: "description", content: r.details },
        { property: "og:title", content: `${r.title} — وفّر` },
        { property: "og:description", content: r.details },
      ],
    };
  },
  notFoundComponent: RewardNotFound,
  component: RewardDetail,
});

function RewardNotFound() {
  const nearest = [...REWARDS_CATALOG].sort((a, b) => a.cost - b.cost)[0];
  return (
    <InvalidLinkFallback
      icon="🎁"
      title="الجائزة غير متوفرة"
      message="يمكن الجائزة انسحبت من الكتالوج. اخترنا لك الأقرب للاستبدال."
      suggestion={{
        to: `/rewards/${nearest.id}`,
        label: nearest.title,
        hint: `${nearest.cost} نقطة`,
        emoji: nearest.icon,
      }}
      backTo={{ to: "/rewards", label: "كل الجوائز" }}
    />
  );
}

function makeCode(id: string) {
  // Deterministic-looking code from id + timestamp for redemption receipt.
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WAF-${id.toUpperCase()}-${rand}`;
}

function RewardDetail() {
  const { reward } = Route.useLoaderData() as { reward: RewardItem };
  const router = useRouter();
  const [state, setState] = useState<RewardState>({ name: "زائر", points: 0, history: [] });
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setState(loadRewards());
    const on = () => setState(loadRewards());
    window.addEventListener("waffer:rewards", on);
    return () => window.removeEventListener("waffer:rewards", on);
  }, []);

  // Check if already redeemed in history.
  const alreadyRedeemed = state.history.find(
    (h) => h.action === "redeem" && h.rewardId === reward.id,
  );

  const can = state.points >= reward.cost;
  const missing = Math.max(0, reward.cost - state.points);
  const progress = Math.min(100, Math.round((state.points / reward.cost) * 100));

  const handleRedeem = () => {
    const res = redeemReward(reward.id, reward.cost, reward.title);
    if (!res.ok) {
      toast.error(`تحتاج ${res.missing} نقطة إضافية`);
      return;
    }
    const code = makeCode(reward.id);
    setRedeemedCode(code);
    setState(res.state);
    toast.success(`🎉 مبروك! تم استبدال ${reward.title}`);
  };

  const copyCode = async () => {
    if (!redeemedCode) return;
    try {
      await navigator.clipboard.writeText(redeemedCode);
      toast.success("تم نسخ كود الاستبدال");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-6">
      <button
        onClick={() => router.history.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowRight className="w-4 h-4" /> رجوع
      </button>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 shadow-glow text-primary-foreground">
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-5xl">
            {reward.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs opacity-80 mb-1">جائزة</div>
            <h1 className="text-2xl md:text-3xl font-black leading-tight">{reward.title}</h1>
            <div className="text-sm opacity-90 mt-1">{reward.desc}</div>
          </div>
        </div>
      </section>

      {/* Points status */}
      <section className="rounded-3xl border border-border/60 bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-muted-foreground">التكلفة</div>
            <div className="text-2xl font-black text-primary tabular-nums">
              {reward.cost} <span className="text-sm font-bold">نقطة</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">نقاطك الحالية</div>
            <div className="text-2xl font-black tabular-nums">{state.points}</div>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-hero transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[11px] text-muted-foreground mt-2">
          {can ? "✨ نقاطك كافية للاستبدال" : `ينقصك ${missing} نقطة`}
        </div>
      </section>

      {/* Details */}
      <section className="rounded-3xl border border-border/60 bg-card p-6">
        <h2 className="font-black text-lg mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> عن الجائزة
        </h2>
        <p className="text-sm leading-7 text-foreground/90">{reward.details}</p>
        <h3 className="font-black text-sm mt-5 mb-2">الشروط</h3>
        <ul className="space-y-2">
          {reward.terms.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Redeem action */}
      {redeemedCode ? (
        <section className="rounded-3xl border-2 border-primary bg-primary/5 p-6 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <div className="font-black text-lg">تم الاستبدال بنجاح</div>
            <div className="text-sm text-muted-foreground">احفظ الكود التالي أو شاركه</div>
          </div>
          <div className="rounded-2xl bg-background border-2 border-dashed border-primary/40 p-4">
            <div className="text-xs text-muted-foreground mb-1">كود الاستبدال</div>
            <div className="font-mono text-xl font-black tracking-wider">{redeemedCode}</div>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90"
            >
              <Copy className="w-4 h-4" /> نسخ الكود
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80"
            >
              <Share2 className="w-4 h-4" /> مشاركة
            </button>
          </div>
          <Link
            to="/rewards"
            className="inline-block text-sm text-primary font-bold underline underline-offset-4"
          >
            رجوع لكل الجوائز
          </Link>
        </section>
      ) : alreadyRedeemed ? (
        <section className="rounded-3xl border border-border/60 bg-secondary/40 p-6 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
          <div className="font-black">استبدلت هذه الجائزة سابقاً</div>
          <div className="text-xs text-muted-foreground">
            بتاريخ {new Date(alreadyRedeemed.at).toLocaleDateString("ar-SA")}
          </div>
          <button
            onClick={handleRedeem}
            disabled={!can}
            className={`mt-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition ${
              can
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            استبدل مرة ثانية
          </button>
        </section>
      ) : (
        <section className="sticky bottom-16 md:bottom-4 z-30">
          <button
            onClick={handleRedeem}
            disabled={!can}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-3xl font-black text-base shadow-glow transition ${
              can
                ? "bg-gradient-hero text-primary-foreground hover:opacity-95 active:scale-[0.99]"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Gift className="w-5 h-5" />
            {can ? `استبدل الآن — ${reward.cost} نقطة` : `يلزمك ${missing} نقطة إضافية`}
          </button>
        </section>
      )}

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={reward.title}
        text={`🎉 استبدلت جائزة "${reward.title}" من وفّر!\nالكود: ${redeemedCode ?? ""}\nاجمع نقاطك واستبدلها.`}
      />
    </div>
  );
}
