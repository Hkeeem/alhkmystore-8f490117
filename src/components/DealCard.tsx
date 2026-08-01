import { type Deal, discountPercent, getStore } from "@/data/deals";
import { Clock, Flame, Share2 } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShareSheet, buildDealShareText, toDealShareMeta } from "./ShareSheet";
import { getDealIcon } from "@/lib/icons";
import { StoreLogo } from "./StoreLogo";

export function DealCard({ deal, rank }: { deal: Deal; rank?: number }) {
  const store = getStore(deal.storeId);
  const off = discountPercent(deal);
  const isHot = off >= 45;
  const [shareOpen, setShareOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const Icon = getDealIcon(deal);

  const hasRealImage = deal.image?.startsWith("http") && !imgError;

  const dealUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/deals/${deal.id}`
      : "";

  return (
    <Link
      to="/deals/$id"
      params={{ id: deal.id }}
      className="group flex flex-col h-full relative bg-card rounded-2xl md:rounded-3xl shadow-md hover:shadow-glow hover-lift press-ripple overflow-hidden border border-border/60 hover:border-primary/40"
    >

      {rank !== undefined && (
        <div className="absolute top-2.5 right-2.5 z-10 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-gold shadow-soft flex items-center justify-center font-display font-black text-xs md:text-sm text-accent-foreground">
          {rank}
        </div>
      )}
      {isHot && (
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-hot text-hot-foreground text-[10px] font-bold shadow-soft">
          <Flame className="w-3 h-3 shrink-0" />
          عرض ناري
        </div>
      )}

      <div className="aspect-square bg-gradient-to-br from-secondary/90 to-secondary flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-gradient-gold" />
        {hasRealImage ? (
          <img
            src={deal.image}
            alt={deal.title}
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
            className="relative w-full h-full object-cover"
          />
        ) : (
          <Icon className="relative w-16 h-16 md:w-20 md:h-20 text-primary drop-shadow-[0_0_16px_oklch(0.77_0.13_85_/_0.6)]" strokeWidth={1.4} />
        )}
        <div className="absolute bottom-2.5 left-2.5 bg-gradient-hero text-primary-foreground px-2.5 py-1 rounded-full text-xs font-black shadow-md">
          −{off}%
        </div>
      </div>

      <div className="flex flex-col flex-1 p-3.5 md:p-4 gap-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <StoreLogo store={store} size="sm" />
            <span className="text-[11px] md:text-xs text-muted-foreground font-medium truncate">{store.name}</span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareOpen(true); }}
            aria-label="مشاركة العرض"
            className="w-8 h-8 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground press-ripple flex items-center justify-center transition shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-[13px] md:text-sm leading-6 line-clamp-2 min-h-[3rem]">{deal.title}</h3>
          {deal.unit && <p className="text-[11px] text-muted-foreground truncate">{deal.unit}</p>}
        </div>

        <div className="mt-auto pt-3 border-t border-border/50 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-xl md:text-2xl text-gold-shine">{deal.price}</span>
              <span className="text-[11px] text-muted-foreground">ر.س</span>
            </div>
            <span className="text-[11px] text-muted-foreground line-through">{deal.originalPrice} ر.س</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/80 px-2 py-1 rounded-full shrink-0">
            <Clock className="w-3 h-3 shrink-0" />
            {deal.expiresIn}
          </div>
        </div>
      </div>


      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`عرض ${deal.title}`}
        text={buildDealShareText(deal, store.name, off)}
        deal={toDealShareMeta(deal, store.name, off)}
        url={dealUrl}
      />
    </Link>
  );
}
