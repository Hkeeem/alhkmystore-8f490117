import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Copy, Share2, Store as StoreIcon, Ticket, Clock, Tag } from "lucide-react";
import { toast } from "sonner";
import { coupons, storeById, type Coupon } from "@/data/coupons";
import { addPoints } from "@/lib/rewards";
import { ShareSheet } from "@/components/ShareSheet";
import { InvalidLinkFallback } from "@/components/InvalidLinkFallback";

export const Route = createFileRoute("/coupons/$id")({
  loader: ({ params }) => {
    const coupon = coupons.find((c) => c.id === params.id);
    if (!coupon) throw notFound();
    return { coupon };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "الكوبون غير متوفر — وفّر" }, { name: "robots", content: "noindex" }] };
    }
    const c = loaderData.coupon;
    const s = storeById(c.storeId);
    return {
      meta: [
        { title: `${c.title} — ${s?.name ?? "كوبون"} — وفّر` },
        { name: "description", content: `${c.description} — الكود: ${c.code}` },
        { property: "og:title", content: `${c.title} — ${s?.name ?? "وفّر"}` },
        { property: "og:description", content: c.description },
      ],
    };
  },
  notFoundComponent: CouponNotFound,
  component: CouponDetail,
});

function CouponNotFound() {
  const nearest = coupons[0];
  const s = nearest ? storeById(nearest.storeId) : undefined;
  return (
    <InvalidLinkFallback
      icon="🎟️"
      title="الكوبون غير متوفر"
      message="يمكن الكوبون انتهى أو تغيّر الكود. جربّ هذا الكوبون المتاح حالياً."
      suggestion={nearest ? {
        to: `/coupons/${nearest.id}`,
        label: `${nearest.title} — ${s?.name ?? ""}`,
        hint: `الكود: ${nearest.code} · ${nearest.discount}`,
        emoji: s?.logo ?? "🎟️",
      } : undefined}
      backTo={{ to: "/coupons", label: "كل الكوبونات" }}
    />
  );
}

function CouponDetail() {
  const { coupon } = Route.useLoaderData() as { coupon: Coupon };
  const router = useRouter();
  const s = storeById(coupon.storeId);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/coupons/${coupon.id}`
      : `/coupons/${coupon.id}`;

  const shareText = `🎟️ كوبون ${s?.name ?? ""}\n${coupon.title}\nالكود: ${coupon.code}\n${coupon.description}\nينتهي: ${coupon.expiresIn}\n\nمن تطبيق وفّر`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      const st = addPoints("copy_coupon");
      toast.success(`تم نسخ ${coupon.code} · +10 نقاط (المجموع ${st.points})`);
      setTimeout(() => setCopied(false), 1800);
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
      <section
        className="relative overflow-hidden rounded-3xl p-8 shadow-glow text-white"
        style={{ background: s?.color ?? "hsl(var(--primary))" }}
      >
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-black">
            {s?.logo ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs opacity-90 mb-1">
              <StoreIcon className="w-3.5 h-3.5" /> {s?.name}
              {coupon.category && (
                <span className="mr-1 px-2 py-0.5 rounded-full bg-white/20 font-bold text-[10px]">
                  {coupon.category}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black leading-tight">{coupon.title}</h1>
            <div className="text-4xl font-black mt-2 tabular-nums">{coupon.discount}</div>
          </div>
        </div>
      </section>

      {/* Code card */}
      <section className="rounded-3xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center">
        <div className="text-xs text-muted-foreground mb-2">كود الخصم</div>
        <div className="font-mono text-3xl md:text-4xl font-black tracking-widest text-primary mb-4">
          {coupon.code}
        </div>
        <button
          onClick={copy}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition ${
            copied ? "bg-green-600 text-white" : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {copied ? <><Check className="w-4 h-4" /> تم النسخ</> : <><Copy className="w-4 h-4" /> انسخ الكود</>}
        </button>
      </section>

      {/* Details */}
      <section className="rounded-3xl border border-border/60 bg-card p-6 space-y-4">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" /> تفاصيل الكوبون
        </h2>
        <p className="text-sm leading-7 text-foreground/90">{coupon.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InfoTile icon={<Tag className="w-4 h-4" />} label="الخصم" value={coupon.discount} />
          <InfoTile
            icon={<Clock className="w-4 h-4" />}
            label="ينتهي خلال"
            value={coupon.expiresIn}
          />
          {coupon.minOrder && (
            <InfoTile
              icon={<Ticket className="w-4 h-4" />}
              label="حد أدنى للطلب"
              value={`${coupon.minOrder} ر.س`}
            />
          )}
        </div>
      </section>

      {/* Share CTA */}
      <button
        onClick={() => setShareOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-3xl bg-secondary hover:bg-secondary/80 font-black text-base transition"
      >
        <Share2 className="w-5 h-5" /> شارك الكوبون مع صحابك
      </button>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={coupon.title}
        text={shareText}
        url={shareUrl}
      />
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon} {label}
      </div>
      <div className="font-black text-sm">{value}</div>
    </div>
  );
}
