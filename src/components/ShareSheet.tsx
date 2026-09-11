import { useEffect, useState } from "react";
import { X, Copy, Check, Share2, Link2 } from "lucide-react";

import { toast } from "sonner";
import type { Deal } from "@/data/deals";
import { addPoints } from "@/lib/rewards";

export type DealShareMeta = {
  title: string;
  storeName: string;
  price: number;
  originalPrice: number;
  off: number;
  unit?: string;
  expiresIn: string;
};

export type SharePlatform =
  "whatsapp" | "telegram" | "x" | "snapchat" | "facebook" | "email" | "copy" | "default";

export function toDealShareMeta(deal: Deal, storeName: string, off: number): DealShareMeta {
  return {
    title: deal.title,
    storeName,
    price: deal.price,
    originalPrice: deal.originalPrice,
    off,
    unit: deal.unit,
    expiresIn: deal.expiresIn,
  };
}

export function buildPlatformDealText(m: DealShareMeta, platform: SharePlatform): string {
  const savedRaw = Math.max(0, m.originalPrice - m.price);
  const saved = (Math.round(savedRaw * 100) / 100).toString().replace(/\.00$/, "");
  const unit = m.unit ? ` (${m.unit})` : "";
  switch (platform) {
    case "whatsapp":
      return `🔥 *عرض من وفّر*\n\n🛍️ *${m.title}*${unit}\n🏬 المتجر: ${m.storeName}\n\n💰 السعر: *${m.price} ر.س*\n~${m.originalPrice} ر.س~\n✅ وفّر ${saved} ر.س (${m.off}٪)\n⏰ ينتهي: ${m.expiresIn}\n\nحمّل وفّر ولا يفوتك العرض 👇`;
    case "telegram":
      return `🔥 عرض من وفّر\n\n🛍️ ${m.title}${unit}\n🏬 ${m.storeName}\n\n💰 ${m.price} ر.س بدل ${m.originalPrice} ر.س\n✅ توفير ${saved} ر.س · خصم ${m.off}٪\n⏰ ينتهي خلال: ${m.expiresIn}`;
    case "x":
      return `🔥 ${m.title} من ${m.storeName}\nبـ ${m.price} ر.س بدل ${m.originalPrice} — وفّر ${m.off}٪ 💸\n#وفّر #عروض_السعودية`;
    case "snapchat":
      return `🔥 ${m.title} · ${m.storeName}\n${m.price} ر.س (وفّر ${m.off}٪)`;
    case "facebook":
      return `🔥 عرض جديد من ${m.storeName}\n${m.title}${unit}\nبـ ${m.price} ر.س بدل ${m.originalPrice} ر.س — توفير ${saved} ر.س (${m.off}٪)\nينتهي: ${m.expiresIn}`;
    case "email":
      return `السلام عليكم،\n\nحبّيت أشاركك عرض حلو لقيته على تطبيق وفّر:\n\nالمنتج: ${m.title}${unit}\nالمتجر: ${m.storeName}\nالسعر: ${m.price} ر.س بدل ${m.originalPrice} ر.س\nالتوفير: ${saved} ر.س (${m.off}٪)\nينتهي خلال: ${m.expiresIn}\n\nتفاصيل العرض على الرابط في الأسفل.`;
    case "copy":
    case "default":
    default:
      return `🔥 عرض من وفّر\n${m.title}${unit}\nالمتجر: ${m.storeName}\nالسعر: ${m.price} ر.س بدل ${m.originalPrice} ر.س\nوفّر ${saved} ر.س · ${m.off}٪\nينتهي: ${m.expiresIn}`;
  }
}

export function buildDealShareText(deal: Deal, storeName: string, off: number) {
  return buildPlatformDealText(toDealShareMeta(deal, storeName, off), "default");
}

export function buildSmartListShareText(result: {
  total: number;
  saved: number;
  strategy: string;
  items: {
    requested: string;
    deal?: { title: string; price: number; originalPrice: number; storeId: string } | null;
  }[];
}) {
  const lines = result.items.map((it, i) => {
    if (!it.deal) return `${i + 1}. ${it.requested} — ما لقينا عرض مطابق`;
    return `${i + 1}. ${it.deal.title} — ${it.deal.price} ر.س`;
  });
  return `🛒 قائمة تسوّق ذكية من وفّر\n\n${lines.join("\n")}\n\nالإجمالي: ${result.total} ر.س\nوفّرت: ${result.saved} ر.س\n\n💡 ${result.strategy}`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
  url?: string;
  deal?: DealShareMeta;
};

function withUtm(rawUrl: string, platform: SharePlatform): string {
  if (!rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    u.searchParams.set(
      "utm_source",
      platform === "default" || platform === "copy" ? "share" : platform,
    );
    u.searchParams.set("utm_medium", "social");
    u.searchParams.set("utm_campaign", "deal_share");
    if (!u.hash) u.hash = `src=${platform}`;
    return u.toString();
  } catch {
    const sep = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${sep}utm_source=${platform}&utm_medium=social&utm_campaign=deal_share`;
  }
}

export function ShareSheet({ open, onClose, title, text, url: explicitUrl, deal }: Props) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  const baseUrl = explicitUrl || pageUrl;

  useEffect(() => {
    if (typeof window !== "undefined" && !explicitUrl) setPageUrl(window.location.href);
  }, [open, explicitUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const textFor = (p: SharePlatform) => (deal ? buildPlatformDealText(deal, p) : text);
  const urlFor = (p: SharePlatform) => withUtm(baseUrl, p);
  const payloadFor = (p: SharePlatform) => `${textFor(p)}\n\n🔗 ${urlFor(p)}`;
  const payload = payloadFor("copy");
  const url = urlFor("copy");

  const channels: {
    name: string;
    color: string;
    icon: string;
    platform: SharePlatform;
    href: string;
  }[] = [
    {
      name: "واتساب",
      color: "#25D366",
      icon: "💬",
      platform: "whatsapp",
      href: `https://wa.me/?text=${encodeURIComponent(payloadFor("whatsapp"))}`,
    },
    {
      name: "تيليجرام",
      color: "#229ED9",
      icon: "✈️",
      platform: "telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(urlFor("telegram"))}&text=${encodeURIComponent(textFor("telegram"))}`,
    },
    {
      name: "X",
      color: "#0f0f0f",
      icon: "𝕏",
      platform: "x",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(textFor("x"))}&url=${encodeURIComponent(urlFor("x"))}`,
    },
    {
      name: "سناب شات",
      color: "#FFFC00",
      icon: "👻",
      platform: "snapchat",
      href: `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(urlFor("snapchat"))}`,
    },
    {
      name: "فيسبوك",
      color: "#1877F2",
      icon: "f",
      platform: "facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlFor("facebook"))}&quote=${encodeURIComponent(textFor("facebook"))}`,
    },
    {
      name: "بريد",
      color: "#6b7280",
      icon: "@",
      platform: "email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(payloadFor("email"))}`,
    },
  ];

  async function nativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        const s = addPoints("share");
        toast.success(`تمت المشاركة · +5 نقاط (المجموع ${s.points})`);
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

  async function copyLink() {
    if (!url) {
      toast.error("ما فيه رابط للنسخ");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      toast.error("ما قدرنا ننسخ الرابط");
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
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center"
          >
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
              onClick={() => {
                addPoints("share");
                onClose();
              }}
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

        {url && (
          <button
            onClick={copyLink}
            className="w-full mb-2 flex items-center gap-2 bg-secondary/60 hover:bg-secondary rounded-2xl px-3 py-2.5 text-xs font-bold transition text-right"
            title={url}
          >
            {linkCopied ? (
              <Check className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <Link2 className="w-4 h-4 text-primary shrink-0" />
            )}
            <span className="shrink-0">{linkCopied ? "تم نسخ الرابط" : "نسخ الرابط فقط"}</span>
            <span
              className="flex-1 truncate text-muted-foreground font-normal ltr:text-left rtl:text-left"
              dir="ltr"
            >
              {url}
            </span>
          </button>
        )}

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
