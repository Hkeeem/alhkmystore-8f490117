import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Gift, Sparkles, Check, CheckCircle2, LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  REWARDS_CATALOG,
  loadRewards,
  type RewardItem,
  type RewardState,
} from "@/lib/rewards";
import { getRewardProfile, redeemRewardServer } from "@/lib/rewards.functions";
import { useAuth } from "@/hooks/use-auth";

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

function RewardDetail() {
  const { reward } = Route.useLoaderData() as { reward: RewardItem };
  const router = useRouter();
  const { user } = useAuth();
  const signedIn = !!user;
  const fetchProfile = useServerFn(getRewardProfile);
  const redeemFn = useServerFn(redeemRewardServer);
  const queryClient = useQueryClient();

  const [local, setLocal] = useState<RewardState>({ name: "زائر", points: 0, history: [] });
  const [requestNumber, setRequestNumber] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLocal(loadRewards());
    const on = () => setLocal(loadRewards());
    window.addEventListener("waffer:rewards", on);
    return () => window.removeEventListener("waffer:rewards", on);
  }, []);

  const profile = useQuery({
    queryKey: ["reward-profile"],
    queryFn: () => fetchProfile(),
    enabled: signedIn,
    staleTime: 30_000,
    retry: 1,
  });

  const points = signedIn ? (profile.data?.points ?? 0) : local.points;
  const can = points >= reward.cost;
  const missing = Math.max(0, reward.cost - points);
  const progress = Math.min(100, Math.round((points / reward.cost) * 100));

  const handleRedeem = async () => {
    if (!signedIn) {
      toast.error("سجّل الدخول أولاً لاستبدال الجوائز — نقاطك محفوظة في حسابك");
      router.navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      const res = await redeemFn({
        data: { rewardId: reward.id, title: reward.title, cost: reward.cost },
      });
      if (!res.ok) {
        toast.error(`تحتاج ${res.missing} نقطة إضافية`);
        return;
      }
      setRemaining(res.remaining);
      setRequestNumber(`HKM-${Date.now().toString(36).toUpperCase()}`);
      toast.success("تم إرسال طلب الاستبدال");
      queryClient.invalidateQueries({ queryKey: ["reward-profile"] });
    } catch {
      toast.error("تعذّر إرسال الطلب، حاول مرة أخرى");
    } finally {
      setBusy(false);
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
            <div className="text-2xl font-black tabular-nums">{points}</div>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-hero transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[11px] text-muted-foreground mt-2">
          {signedIn
            ? can
              ? "نقاطك كافية للاستبدال"
              : `ينقصك ${missing} نقطة`
            : "سجّل الدخول لاستخدام نقاطك المحفوظة في حسابك"}
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
      {requestNumber ? (
        <section className="rounded-3xl border-2 border-primary bg-primary/5 p-6 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <div className="font-black text-lg">تم إرسال طلب الاستبدال</div>
            <div className="text-sm text-muted-foreground mt-1">
              طلبك قيد التجهيز، وسيتم إرسال الجائزة على بريدك المسجّل.
            </div>
          </div>
          <div className="rounded-2xl bg-background border-2 border-dashed border-primary/40 p-4">
            <div className="text-xs text-muted-foreground mb-1">رقم الطلب</div>
            <div className="font-mono text-xl font-black tracking-wider">{requestNumber}</div>
          </div>
          <div className="text-xs text-muted-foreground">
            نقاطك المتبقية: <span className="font-black text-foreground">{remaining}</span>
          </div>
          <Link
            to="/rewards"
            className="inline-block text-sm text-primary font-bold underline underline-offset-4"
          >
            رجوع لكل الجوائز
          </Link>
        </section>
      ) : (
        <section className="sticky bottom-16 md:bottom-4 z-30 space-y-2">
          {!signedIn && (
            <p className="text-center text-xs text-muted-foreground">
              الاستبدال متاح للمستخدمين المسجلين — نقاطك على هذا الجهاز تُنقل لحسابك عند تسجيل الدخول
            </p>
          )}
          <button
            onClick={handleRedeem}
            disabled={busy || (signedIn && !can)}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-3xl font-black text-base shadow-glow transition ${
              !signedIn || can
                ? "bg-gradient-hero text-primary-foreground hover:opacity-95 active:scale-[0.99]"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            } disabled:opacity-70`}
          >
            {busy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : signedIn ? (
              <Gift className="w-5 h-5" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {busy
              ? "جارٍ إرسال الطلب…"
              : signedIn
                ? can
                  ? `استبدل الآن — ${reward.cost} نقطة`
                  : `يلزمك ${missing} نقطة إضافية`
                : "سجّل الدخول للاستبدال"}
          </button>
        </section>
      )}
    </div>
  );
}

import { InvalidLinkFallback } from "@/components/InvalidLinkFallback";
