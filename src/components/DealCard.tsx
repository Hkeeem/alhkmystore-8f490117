import { type Deal, discountPercent, getStore } from "@/data/deals";
import { Clock, Flame, Share2 } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShareSheet, buildDealShareText } from "./ShareSheet";

export function DealCard({ deal, rank }: { deal: Deal; rank?: number }) {
  const store = getStore(deal.storeId);
  const off = discountPercent(deal);
  const isHot = off >= 45;
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="group relative bg-card rounded-3xl shadow-card hover:shadow-glow transition-all overflow-hidden border border-border/50">
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

      <div className="aspect-square bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-7xl relative">
        <span className="drop-shadow-sm">{deal.image}</span>
        <div className="absolute bottom-2 left-2 bg-gradient-hero text-primary-foreground px-2.5 py-1 rounded-full text-xs font-black shadow-soft">
          −{off}%
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black"
            style={{ background: store.color }}
          >
            {store.logo}
          </div>
          <span className="text-xs text-muted-foreground font-medium truncate flex-1">{store.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
            aria-label="مشاركة العرض"
            className="w-7 h-7 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="font-bold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{deal.title}</h3>

        {deal.unit && <p className="text-xs text-muted-foreground">{deal.unit}</p>}

        <div className="flex items-end justify-between pt-1">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-xl text-primary">{deal.price}</span>
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
      />
    </div>
  );
}
