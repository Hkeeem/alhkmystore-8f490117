import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Sparkles, Gift, Ticket, Share2, ListChecks, Eye, Crown, Medal, Award } from "lucide-react";
import { toast } from "sonner";
import {
  loadRewards,
  saveRewards,
  ACTION_LABEL,
  ACTION_POINTS,
  SEED_LEADERBOARD,
  type RewardState,
  type RewardAction,
} from "@/lib/rewards";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "الجوائز ولوحة المتصدرين — وفّر" },
      { name: "description", content: "اكسب نقاطاً في وفّر كل ما نسخت كوبون أو شاركت عرض أو بنيت قائمة تسوّق ذكية — واستبدلها بجوائز." },
      { property: "og:title", content: "الجوائز ولوحة المتصدرين — وفّر" },
      { property: "og:description", content: "اجمع النقاط وتصدّر لوحة أفضل الموفّرين في المملكة." },
    ],
  }),
  component: RewardsPage,
});

const ACTION_ICON: Record<RewardAction, typeof Ticket> = {
  copy_coupon: Ticket,
  share: Share2,
  visit_deal: Eye,
  smart_list: ListChecks,
};

function tierFor(points: number) {
  if (points >= 1000) return { name: "بلاتيني", color: "oklch(0.7 0.15 260)", next: null, icon: Crown };
  if (points >= 500) return { name: "ذهبي", color: "oklch(0.75 0.16 85)", next: 1000, icon: Trophy };
  if (points >= 200) return { name: "فضّي", color: "oklch(0.7 0.02 250)", next: 500, icon: Medal };
  return { name: "برونزي", color: "oklch(0.55 0.12 40)", next: 200, icon: Award };
}

function RewardsPage() {
  const [state, setState] = useState<RewardState>({ name: "زائر", points: 0, history: [] });
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const s = loadRewards();
    setState(s);
    setNameInput(s.name === "زائر" ? "" : s.name);
    const on = () => setState(loadRewards());
    window.addEventListener("waffer:rewards", on);
    return () => window.removeEventListener("waffer:rewards", on);
  }, []);

  const tier = tierFor(state.points);
  const TierIcon = tier.icon;
  const progress = tier.next ? Math.min(100, Math.round((state.points / tier.next) * 100)) : 100;

  const leaderboard = [...SEED_LEADERBOARD, { name: state.name || "أنت", points: state.points, isMe: true }]
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
  const myRank = leaderboard.findIndex((r) => (r as any).isMe) + 1;

  const rewards = [
    { id: "r1", cost: 100, title: "كود شحن مجاني", desc: "على أول طلب من هنقرستيشن", icon: "🚚" },
    { id: "r2", cost: 250, title: "خصم 25 ر.س نون", desc: "قسيمة إلكترونيات من نون", icon: "🛒" },
    { id: "r3", cost: 500, title: "بطاقة جرير 50 ر.س", desc: "قسيمة شراء إلكترونية", icon: "🎁" },
    { id: "r4", cost: 1000, title: "بطاقة هدايا 100 ر.س", desc: "لأي متجر من متاجر وفّر", icon: "💎" },
  ];

  const saveName = () => {
    const next = { ...state, name: nameInput.trim() || "زائر" };
    saveRewards(next);
    setState(next);
    toast.success("تم حفظ اسمك في لوحة المتصدرين");
  };

  const redeem = (cost: number, title: string) => {
    if (state.points < cost) {
      toast.error(`تحتاج ${cost - state.points} نقطة إضافية`);
      return;
    }
    const next: RewardState = {
      ...state,
      points: state.points - cost,
      history: [{ action: "copy_coupon" as RewardAction, points: -cost, at: Date.now() }, ...state.history].slice(0, 50),
    };
    saveRewards(next);
    setState(next);
    toast.success(`🎉 مبروك! تم استبدال: ${title}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-6">
      {/* Hero card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 md:p-8 shadow-glow">
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center">
              <TierIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs opacity-80">مستواك</div>
              <div className="text-2xl font-black">{tier.name}</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black tabular-nums">{state.points}</span>
              <span className="text-sm opacity-90">نقطة</span>
              {myRank > 0 && (
                <span className="mr-auto text-xs opacity-90">ترتيبك: #{myRank}</span>
              )}
            </div>
            {tier.next ? (
              <>
                <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-[11px] opacity-90 mt-1">
                  {tier.next - state.points} نقطة للوصول للمستوى التالي
                </div>
              </>
            ) : (
              <div className="text-[11px] opacity-90 mt-2">أعلى مستوى — أنت أسطورة! 👑</div>
            )}
          </div>
        </div>
      </section>

      {/* Name input */}
      <section className="rounded-3xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-black">اسمك في لوحة المتصدرين</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="اكتب اسمك (مثلاً: أبو خالد)"
            className="flex-1 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none focus:border-primary transition"
          />
          <button
            onClick={saveName}
            className="px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90"
          >
            حفظ
          </button>
        </div>
      </section>

      {/* How to earn */}
      <section className="rounded-3xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-4 h-4 text-primary" />
          <h2 className="font-black">كيف تجمع نقاط؟</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(ACTION_POINTS) as RewardAction[]).map((a) => {
            const Icon = ACTION_ICON[a];
            return (
              <div key={a} className="rounded-2xl bg-secondary/50 p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm font-bold">{ACTION_LABEL[a]}</div>
                <div className="text-xs text-primary font-black mt-1">+{ACTION_POINTS[a]} نقاط</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rewards catalog */}
      <section>
        <h2 className="font-black text-xl mb-3 flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" /> استبدل نقاطك
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map((r) => {
            const can = state.points >= r.cost;
            return (
              <div key={r.id} className="rounded-3xl border border-border/60 bg-card p-5 flex items-center gap-4">
                <div className="text-4xl">{r.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-black">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                  <div className="text-xs text-primary font-bold mt-1">{r.cost} نقطة</div>
                </div>
                <button
                  disabled={!can}
                  onClick={() => redeem(r.cost, r.title)}
                  className={`px-4 py-2 rounded-2xl text-sm font-bold transition ${
                    can ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-secondary text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {can ? "استبدل" : "غير كافٍ"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Leaderboard */}
      <section>
        <h2 className="font-black text-xl mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> لوحة أفضل الموفّرين
        </h2>
        <div className="rounded-3xl border border-border/60 bg-card overflow-hidden">
          {leaderboard.map((r, i) => {
            const isMe = (r as any).isMe;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-5 py-3 border-b border-border/40 last:border-0 ${
                  isMe ? "bg-primary/5" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                    i === 0
                      ? "bg-yellow-400 text-yellow-950"
                      : i === 1
                      ? "bg-slate-300 text-slate-900"
                      : i === 2
                      ? "bg-amber-600 text-amber-50"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="flex-1 font-bold">
                  {r.name} {isMe && <span className="text-primary text-xs">(أنت)</span>}
                </div>
                <div className="tabular-nums font-black text-primary">{r.points}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* History */}
      {state.history.length > 0 && (
        <section>
          <h2 className="font-black text-xl mb-3">آخر النشاطات</h2>
          <div className="rounded-3xl border border-border/60 bg-card p-2">
            {state.history.slice(0, 10).map((h, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="flex-1">{ACTION_LABEL[h.action] ?? "استبدال"}</span>
                <span className={`font-black tabular-nums ${h.points > 0 ? "text-green-600" : "text-red-500"}`}>
                  {h.points > 0 ? "+" : ""}{h.points}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
