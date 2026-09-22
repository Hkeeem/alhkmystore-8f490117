import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Sparkles, ShieldCheck, FileText, UserMinus, Mail, MessageCircleQuestion } from "lucide-react";

export const SUPPORT_EMAIL = "support@alhkmy.store";

const SOCIAL_LINKS = [
  {
    id: "x",
    label: "X",
    href: "https://x.com/hkeeeeem",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "snapchat",
    label: "سناب شات",
    href: "https://www.snapchat.com/add/maktb24?share_id=tOC-vP2GdUY&locale=ar-AE",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2c-1.66 0-3 1.34-3 3 0 .17.02.34.06.5-.67.22-1.27.62-1.72 1.16-.6.7-.94 1.6-.94 2.59 0 1.5.66 2.84 1.7 3.76-.1.37-.16.76-.16 1.16 0 .68.18 1.32.5 1.87.3.5.72.9 1.2 1.18.2.95.85 1.73 1.73 2.13.43.18.88.28 1.33.28s.9-.1 1.33-.28c.88-.4 1.53-1.18 1.73-2.13.48-.28.9-.68 1.2-1.18.32-.55.5-1.19.5-1.87 0-.4-.06-.79-.16-1.16 1.04-.92 1.7-2.26 1.7-3.76 0-.99-.34-1.89-.94-2.59-.45-.54-1.05-.94-1.72-1.16.04-.16.06-.33.06-.5 0-1.66-1.34-3-3-3z" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    label: "تيك توك",
    href: "https://www.tiktok.com/@hkeeeeem?_r=1&_t=ZS-99Dw5t5oEa5",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    label: "واتساب",
    href: "https://wa.me/966500000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    ),
  },
  {
    id: "email",
    label: "البريد",
    href: `mailto:${SUPPORT_EMAIL}`,
    icon: <Mail className="w-4 h-4" />,
  },
];

export function Footer() {
  const { t, lang } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-primary/15 bg-card/60">
      <div className="max-w-6xl mx-auto px-4 py-8 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] items-start">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-secondary glow-gold flex items-center justify-center ring-1 ring-primary/40">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-black text-lg text-gold-shine">HkeeemAI</div>
            <p className="text-xs text-muted-foreground">{t("nav.tagline")}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-gold-shine bg-secondary/60 border border-primary/20 rounded-xl px-3 py-2">
            💡 حكيم مجاني 100% — نحصل على عمولة إحالة من المتاجر دون أي تكلفة إضافية عليك
          </p>
          <nav className="flex flex-wrap gap-2">
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/60 text-xs font-bold hover:bg-secondary press-ripple transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" /> {t("footer.about")}
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/60 text-xs font-bold hover:bg-secondary press-ripple transition"
            >
              <MessageCircleQuestion className="w-3.5 h-3.5 text-primary" /> {t("footer.faq")}
            </Link>
            <Link
              to="/privacy"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/60 text-xs font-bold hover:bg-secondary press-ripple transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> {t("footer.privacy")}
            </Link>
            <Link
              to="/terms"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/60 text-xs font-bold hover:bg-secondary press-ripple transition"
            >
              <FileText className="w-3.5 h-3.5 text-primary" /> {t("footer.terms")}
            </Link>
            <Link
              to="/delete-account"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/60 text-xs font-bold hover:bg-secondary press-ripple transition"
            >
              <UserMinus className="w-3.5 h-3.5 text-primary" /> {t("footer.deleteAccount")}
            </Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            © {year} HkeeemAI — {lang === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
          <div className="flex items-center gap-2" aria-label={t("footer.contact")}>
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="w-9 h-9 rounded-xl bg-secondary/60 text-muted-foreground hover:text-primary hover:bg-secondary hover:scale-110 press-ripple transition flex items-center justify-center ring-1 ring-primary/10"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LegalPage({
  icon: Icon,
  title,
  updated,
  intro,
  children,
}: {
  icon: React.ElementType;
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-3xl mx-auto px-4 pt-6 pb-12 space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-gold glow-gold flex items-center justify-center">
            <Icon className="w-6 h-6 text-secondary" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display font-black text-2xl md:text-3xl text-gold-shine">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground">آخر تحديث: {updated}</p>
          </div>
        </div>
      </header>

      <p className="text-sm text-muted-foreground leading-relaxed bg-card rounded-2xl border border-border/60 shadow-card p-4">
        {intro}
      </p>

      <div className="space-y-4">{children}</div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl border border-border/60 shadow-card p-5 space-y-2">
      <h2 className="font-black text-base">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
