import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Sparkles, Gift, Ticket, Share2, ListChecks, Eye, Crown, Medal, Award, Trash2, Filter, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import {
  loadRewards,
  saveRewards,
  clearHistory,
  ACTION_LABEL,
  ACTION_POINTS,
  SEED_LEADERBOARD,
  REWARDS_CATALOG,
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
  const [historyFilter, setHistoryFilter] = useState<"all" | RewardAction | "redeem">("all");

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

  const rewards = REWARDS_CATALOG;

  const saveName = () => {
    const next = { ...state, name: nameInput.trim() || "زائر" };
    saveRewards(next);
    setState(next);
    toast.success("تم حفظ اسمك في لوحة المتصدرين");
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
              <Link
                key={r.id}
                to="/rewards/$id"
                params={{ id: r.id }}
                className="group rounded-3xl border border-border/60 bg-card p-5 flex items-center gap-4 hover:border-primary/60 hover:shadow-md transition"
              >
                <div className="text-4xl">{r.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-black">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                  <div className="text-xs text-primary font-bold mt-1">{r.cost} نقطة</div>
                </div>
                <div
                  className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-1 ${
                    can ? "bg-primary text-primary-foreground group-hover:opacity-90" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  التفاصيل <ChevronLeft className="w-4 h-4" />
                </div>
              </Link>
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
      <HistorySection
        history={state.history}
        filter={historyFilter}
        setFilter={setHistoryFilter}
        onClear={() => {
          if (state.history.length === 0) return;
          clearHistory();
          setState(loadRewards());
          toast.success("تم مسح سجل النشاطات");
        }}
      />
    </div>
  );
}

function HistorySection({
  history,
  filter,
  setFilter,
  onClear,
}: {
  history: RewardState["history"];
  filter: "all" | RewardAction | "redeem";
  setFilter: (f: "all" | RewardAction | "redeem") => void;
  onClear: () => void;
}) {
  const filtered = useMemo(() => {
    if (filter === "all") return history;
    if (filter === "redeem") return history.filter((h) => h.points < 0);
    return history.filter((h) => h.points > 0 && h.action === filter);
  }, [history, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: history.length, redeem: 0 };
    (Object.keys(ACTION_POINTS) as RewardAction[]).forEach((a) => (c[a] = 0));
    history.forEach((h) => {
      if (h.points < 0) c.redeem += 1;
      else c[h.action] = (c[h.action] ?? 0) + 1;
    });
    return c;
  }, [history]);

  const chips: { key: "all" | RewardAction | "redeem"; label: string }[] = [
    { key: "all", label: "الكل" },
    ...(Object.keys(ACTION_POINTS) as RewardAction[]).map((a) => ({ key: a, label: ACTION_LABEL[a] })),
    { key: "redeem" as const, label: "استبدال" },
  ];

  const fmt = (t: number) => {
    try {
      return new Date(t).toLocaleString("ar-SA", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-black text-xl flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" /> سجل النشاطات
        </h2>
        <button
          onClick={onClear}
          disabled={history.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> مسح السجل
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
        {chips.map((c) => {
          const active = filter === c.key;
          const n = counts[c.key] ?? 0;
          return (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
              }`}
            >
              {c.label}
              <span className={`mr-1.5 tabular-nums ${active ? "opacity-90" : "opacity-60"}`}>({n})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-8 text-center text-sm text-muted-foreground">
          {history.length === 0 ? "ما فيه نشاطات لسا — ابدأ اجمع نقاط!" : "لا توجد نشاطات ضمن هذا الفلتر"}
        </div>
      ) : (
        <div className="rounded-3xl border border-border/60 bg-card overflow-hidden">
          {filtered.map((h, i) => {
            const isRedeem = h.action === "redeem" || h.points < 0;
            const Icon = isRedeem ? Gift : ACTION_ICON[h.action as RewardAction] ?? Sparkles;
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isRedeem ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">
                    {isRedeem ? h.label ?? "استبدال جائزة" : ACTION_LABEL[h.action as RewardAction]}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{fmt(h.at)}</div>
                </div>
                <span
                  className={`font-black tabular-nums text-sm ${
                    h.points > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {h.points > 0 ? "+" : ""}
                  {h.points}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
