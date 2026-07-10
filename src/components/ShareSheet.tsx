import { useEffect, useState } from "react";
import { X, Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Deal } from "@/data/deals";

export function buildDealShareText(deal: Deal, storeName: string, off: number) {
  return `🔥 عرض من وفّر\n${deal.title}${deal.unit ? ` (${deal.unit})` : ""}\nالمتجر: ${storeName}\nالسعر: ${deal.price} ر.س بدل ${deal.originalPrice} ر.س\nوفّر ${off}٪ · ينتهي: ${deal.expiresIn}`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
};

export function ShareSheet({ open, onClose, title, text }: Props) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setUrl(window.location.href);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const payload = `${text}\n\n${url}`;
  const enc = encodeURIComponent(payload);

  const channels: { name: string; color: string; icon: string; href: string }[] = [
    { name: "واتساب", color: "#25D366", icon: "💬", href: `https://wa.me/?text=${enc}` },
    { name: "تيليجرام", color: "#229ED9", icon: "✈️", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { name: "X", color: "#0f0f0f", icon: "𝕏", href: `https://twitter.com/intent/tweet?text=${enc}` },
    { name: "سناب شات", color: "#FFFC00", icon: "👻", href: `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}` },
    { name: "فيسبوك", color: "#1877F2", icon: "f", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${enc}` },
    { name: "بريد", color: "#6b7280", icon: "@", href: `mailto:?subject=${encodeURIComponent(title)}&body=${enc}` },
  ];

  async function nativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        toast.success("تمت المشاركة بنجاح");
        onClose();
      } else {
        await copy();
      }
    } catch {
      toast.error("ما قدرنا نشارك العرض، جرّب نسخ الرابط");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      toast.success("تم نسخ العرض");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("ما قدرنا ننسخ العرض");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-md bg-card rounded-t-3xl md:rounded-3xl shadow-glow border border-border p-5 animate-in slide-in-from-bottom duration-200"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-black text-lg">شارك مع أصحابك</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">خلّهم يستفيدون من العرض قبل ما ينتهي</p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {channels.map((c) => (
            <a
              key={c.name}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-secondary hover:bg-primary/10 border border-transparent hover:border-primary transition"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black shadow-soft"
                style={{ background: c.color, color: c.color === "#FFFC00" ? "#000" : "#fff" }}
              >
                {c.icon}
              </div>
              <span className="text-[11px] font-bold">{c.name}</span>
            </a>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={copy}
            className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/70 rounded-2xl py-3 text-sm font-bold transition"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            {copied ? "تم النسخ" : "نسخ العرض"}
          </button>
          <button
            onClick={nativeShare}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-hero text-primary-foreground rounded-2xl py-3 text-sm font-bold shadow-glow"
          >
            <Share2 className="w-4 h-4" />
            مشاركة
          </button>
        </div>
      </div>
    </div>
  );
}
