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
      className="group block relative bg-card rounded-3xl shadow-card hover:shadow-glow hover-lift press-ripple overflow-hidden border border-border/50 hover:border-primary/40"
    >

      {rank !== undefined && (
        <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-gradient-gold shadow-soft flex items-center justify-center font-display font-black text-sm text-accent-foreground">
          {rank}
        </div>
      )}
      {isHot && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-hot text-hot-foreground text-[10px] font-bold shadow-soft">
          <Flame className="w-3 h-3" />
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
          <Icon className="relative w-20 h-20 text-primary drop-shadow-[0_0_16px_oklch(0.77_0.13_85_/_0.6)]" strokeWidth={1.4} />
        )}
        <div className="absolute bottom-2 left-2 bg-gradient-hero text-primary-foreground px-2.5 py-1 rounded-full text-xs font-black shadow-soft">
          −{off}%
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <StoreLogo store={store} size="sm" />
          <span className="text-xs text-muted-foreground font-medium truncate flex-1">{store.name}</span>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareOpen(true); }}
            aria-label="مشاركة العرض"
            className="w-7 h-7 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground press-ripple flex items-center justify-center transition shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

        </div>

        <h3 className="font-bold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{deal.title}</h3>

        {deal.unit && <p className="text-xs text-muted-foreground">{deal.unit}</p>}

        <div className="flex items-end justify-between pt-1">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-xl text-gold-shine">{deal.price}</span>
              <span className="text-xs text-muted-foreground">ر.س</span>
            </div>
            <span className="text-xs text-muted-foreground line-through">{deal.originalPrice} ر.س</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
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
