import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Copy, Share2, Store as StoreIcon, Ticket, Clock, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchLiveCoupons } from "@/lib/coupons-api";
import { addPoints } from "@/lib/rewards";
import { ShareSheet } from "@/components/ShareSheet";
import { InvalidLinkFallback } from "@/components/InvalidLinkFallback";

export const Route = createFileRoute("/coupons/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الكوبون — حكيم AI" },
      { name: "description", content: "تفاصيل كود الخصم الموثّق: نسبة الخصم، الحد الأدنى للطلب، وتاريخ الانتهاء." },
      { property: "og:title", content: "تفاصيل الكوبون — حكيم AI" },
      { property: "og:description", content: "كود خصم موثّق من تاجر معتمد داخل تطبيق حكيم AI." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CouponDetail,
});

function CouponDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const couponsQ = useQuery({
    queryKey: ["live-coupons"],
    queryFn: () => fetchLiveCoupons(),
    staleTime: 30_000,
  });

  const coupon = (couponsQ.data ?? []).find((c) => c.id === id);

  if (couponsQ.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-muted-foreground py-24">
        <Loader2 className="w-5 h-5 animate-spin" /> جارِ تحميل الكوبون...
      </div>
    );
  }

  if (!coupon) {
    const nearest = couponsQ.data?.[0];
    return (
      <InvalidLinkFallback
        icon="🎟️"
        title="الكوبون غير متوفر"
        message="يمكن الكوبون انتهى أو تغيّر الكود. جربّ هذا الكوبون المتاح حالياً."
        suggestion={nearest ? {
          to: `/coupons/${nearest.id}`,
          label: `${nearest.title} — ${nearest.storeName}`,
          hint: `الكود: ${nearest.code} · ${nearest.discount}`,
          emoji: nearest.logo ?? "🎟️",
        } : undefined}
        backTo={{ to: "/coupons", label: "كل الكوبونات" }}
      />
    );
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/coupons/${coupon.id}`
      : `/coupons/${coupon.id}`;

  const shareText = `🎟️ كوبون ${coupon.storeName}\n${coupon.title}\nالكود: ${coupon.code}\n${coupon.description}\nينتهي: ${coupon.expiresIn}\n\nمن تطبيق حكيم AI`;

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

      <section
        className="relative overflow-hidden rounded-3xl p-8 shadow-glow text-white"
        style={{ background: coupon.color ?? "hsl(var(--primary))" }}
      >
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-black">
            {coupon.logo ?? coupon.storeName.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs opacity-90 mb-1">
              <StoreIcon className="w-3.5 h-3.5" /> {coupon.storeName}
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

      <section className="rounded-3xl border border-border/60 bg-card p-6 space-y-4">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" /> تفاصيل الكوبون
        </h2>
        <p className="text-sm leading-7 text-foreground/90">{coupon.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InfoTile icon={<Tag className="w-4 h-4" />} label="الخصم" value={coupon.discount} />
          <InfoTile icon={<Clock className="w-4 h-4" />} label="ينتهي خلال" value={coupon.expiresIn} />
          {coupon.minOrder && (
            <InfoTile icon={<Ticket className="w-4 h-4" />} label="حد أدنى للطلب" value={`${coupon.minOrder} ر.س`} />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">المصدر: {coupon.source}</p>
      </section>

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
