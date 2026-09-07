import { type Deal, discountPercent, getStore, isLastDay } from "@/data/deals";
import { Clock, Share2, Info, BadgeCheck, Copy, ExternalLink, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { toggleFavorite } from "@/lib/user.functions";
import { useAuth } from "@/hooks/use-auth";
import { timeAgoAr } from "@/hooks/use-live-deals";
import { ShareSheet, buildDealShareText, toDealShareMeta } from "./ShareSheet";
import { getDealIcon } from "@/lib/icons";
import { StoreLogo } from "./StoreLogo";

/** وسم شفافية يوضح سبب ترقية العرض */
function transparencyTag(deal: Deal, off: number): string | null {
  if ((deal.rating ?? 0) >= 4.7) return "أعلى تقييم موثّق";
  if (off >= 40) return "أقل سعر موثّق";
  if ((deal.usageCount ?? 0) >= 1000) return "الأكثر استخداماً";
  return null;
}

export function DealCard({
  deal,
  reason,
  reasonDetail,
}: {
  deal: Deal;
  rank?: number;
  /** سبب مختصر لترقية العرض في الترتيب الذكي */
  reason?: string | null;
  /** شرح تفصيلي يظهر عند الضغط على التلميح */
  reasonDetail?: string;
}) {
  const store = getStore(deal.storeId);
  const off = discountPercent(deal);
  const savings = Math.max(0, Math.round(deal.originalPrice - deal.price));
  const [shareOpen, setShareOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = getDealIcon(deal);
  const { user } = useAuth();
  const toggleFav = useServerFn(toggleFavorite);
  const tag = transparencyTag(deal, off);
  const verified = deal.verifiedAt ? timeAgoAr(deal.verifiedAt) : null;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const hasRealImage = deal.image?.startsWith("http") && !imgError;

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/deals/${deal.id}` : "";
  const storeUrl = `/api/public/go/${deal.id}`;

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!deal.couponCode) return;
    void navigator.clipboard?.writeText(deal.couponCode);
    setCopied(true);
    toast.success(`تم نسخ كود الخصم ${deal.couponCode}`);
    timer.current = setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("سجّل الدخول لحفظ العرض في المحفوظات");
      return;
    }
    setSaving(true);
    try {
      const r = await toggleFav({ data: { itemType: "deal", itemId: deal.id } });
      setSaved(r.favorited);
      toast.success(r.favorited ? "أُضيف إلى المحفوظات" : "أُزيل من المحفوظات");
    } catch {
      toast.error("تعذّر حفظ العرض");
    } finally {
      setSaving(false);
    }
  };

  const handleCta = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(storeUrl, "_blank", "noopener,noreferrer");
  };


  return (
    <Link
      to="/deals/$id"
      params={{ id: deal.id }}
      className="hk-card group flex flex-col h-full relative overflow-hidden"
    >
      <div className="relative aspect-[4/3] bg-zinc-50">
        {hasRealImage ? (
          <img
            src={deal.image}
            alt={deal.title}
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-14 h-14 text-zinc-400" strokeWidth={1.4} />
          </div>
        )}

        <div className="absolute top-3 right-3 bg-amber-400 text-zinc-900 text-[11px] font-black px-2.5 py-1 rounded-full shadow">
          وفر {savings} ر.س
        </div>

        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center overflow-hidden">
          <StoreLogo store={store} size="sm" />
        </div>

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareOpen(true); }}
          aria-label="مشاركة العرض"
          className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center"
        >
          <Share2 className="w-3.5 h-3.5 text-zinc-700" />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center gap-1.5 text-[13px] text-zinc-500">
          <span className="text-amber-400">★</span>
          <span className="font-bold text-zinc-900">{(deal.rating ?? 4.8).toFixed(1)}</span>
          <span>({deal.ratingCount ?? 2100})</span>
          <span>•</span>
          <span>{deal.usageCount ?? 1243} استخدام</span>
        </div>

        <h3 className="font-bold text-[15px] leading-snug line-clamp-2 text-zinc-900">{deal.title}</h3>
        {deal.unit && <p className="text-[12px] text-zinc-400">{deal.unit}</p>}

        {reason && (
          <div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWhyOpen((v) => !v); }}
              aria-expanded={whyOpen}
              aria-label={`لماذا هذا العرض في الأعلى؟ ${reason}`}
              title={reasonDetail ?? reason}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#5B21B6]/10 text-[#5B21B6] text-[10px] font-bold"
            >
              <Info className="w-3 h-3 shrink-0" />
              {reason}
            </button>
            {whyOpen && reasonDetail && (
              <p className="mt-1.5 whitespace-pre-line text-[10px] leading-5 text-zinc-500 bg-zinc-50 rounded-xl p-2 border border-zinc-100">
                {reasonDetail}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[12px] text-zinc-400 line-through">{deal.originalPrice} ر.س</span>
            <span className="text-[18px] font-black text-[#5B21B6]">{deal.price} ر.س</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-zinc-500 shrink-0">
            <Clock className="w-3 h-3" /> {deal.expiresIn}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCta}
          className={`w-full h-11 rounded-full font-bold text-[14px] transition-all ${
            copied ? "bg-emerald-500 text-white" : "bg-[#5B21B6] text-white"
          }`}
        >
          {copied
            ? `✓ تم النسخ - توجه لـ${store.name}`
            : deal.couponCode
              ? "انسخ الكوبون"
              : `اذهب للعرض · خصم ${off}%`}
        </button>
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`عرض ${deal.title}`}
        text={buildDealShareText(deal, store.name, off)}
        deal={toDealShareMeta(deal, store.name, off)}
        url={shareUrl}
      />
    </Link>
  );
}
