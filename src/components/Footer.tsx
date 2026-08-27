import { Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, FileText, UserMinus, Mail } from "lucide-react";

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
        <path d="M12.206.793c.99 0 3.794.558 5.16 4.678.648 1.816 1.252 3.678 1.252 3.678s.31.84.748 1.042c.438.202 1.006.126 1.006.126s.116-.014.21-.05c.093-.036.168-.116.168-.116s.09-.104.146-.17c.056-.066.084-.128.084-.128s.034-.076.05-.122c.016-.046.02-.098.02-.098s.008-.058-.006-.112c-.014-.054-.044-.102-.044-.102s-.034-.06-.078-.098c-.044-.038-.1-.064-.1-.064s-.064-.026-.128-.034c-.064-.008-.128 0-.128 0s-.072.008-.136.028c-.064.02-.12.054-.12.054s-.104.056-.19.132c-.086.076-.17.17-.17.17s-.064.074-.11.14c-.046.066-.08.136-.08.136s-.056.096-.09.186c-.034.09-.05.188-.05.188s-.016.104-.006.204c.01.1.038.194.038.194s.034.096.082.18c.048.084.11.156.11.156s.074.074.156.13c.082.056.176.094.176.094s.106.034.21.046c.104.012.21.006.21.006s.1-.012.196-.04c.096-.028.186-.074.186-.074s.086-.046.16-.102c.074-.056.138-.12.138-.12s.056-.062.1-.12c.044-.058.076-.12.076-.12s.026-.056.04-.104c.014-.048.016-.096.016-.096s.004-.044-.008-.084-.02-.074-.02-.074-.018-.048-.046-.082c-.028-.034-.066-.06-.066-.06s-.046-.024-.094-.032c-.048-.008-.096-.004-.096-.004s-.052.006-.098.022c-.046.016-.086.044-.086.044s-.07.04-.126.098c-.056.058-.11.13-.11.13s-.044.054-.076.104c-.032.05-.056.104-.056.104s-.034.068-.05.134c-.016.066-.02.134-.02.134s-.004.07.006.134c.01.064.032.124.032.124s.028.06.064.11c.036.05.08.092.08.092s.054.048.114.084c.06.036.126.06.126.06s.076.022.152.028c.076.006.152 0 .152 0s.072-.01.14-.034c.068-.024.13-.062.13-.062s.06-.038.11-.086c.05-.048.092-.104.092-.104s.036-.052.062-.1c.026-.048.04-.098.04-.098s.012-.044.014-.086c.002-.042-.004-.082-.004-.082s-.01-.04-.03-.07c-.02-.03-.048-.052-.048-.052s-.034-.02-.068-.026c-.034-.006-.068-.002-.068-.002s-.036.004-.066.016c-.03.012-.056.034-.056.034s-.046.026-.082.066c-.036.04-.068.09-.068.09s-.026.04-.044.078c-.018.038-.028.078-.028.078s-.008.04.002.076c.01.036.026.068.026.068s.02.032.044.058c.024.026.052.046.052.046s.034.026.07.044c.036.018.074.028.074.028s.04.008.078.008c.038 0 .074-.008.074-.008s.034-.01.064-.026c.03-.016.056-.04.056-.04s.022-.02.04-.044.03-.05.03-.05.01-.026.012-.05c.002-.024-.002-.046-.002-.046s-.006-.02-.018-.034c-.012-.014-.028-.024-.028-.024s-.02-.012-.04-.016c-.02-.004-.04 0-.04 0s-.02.002-.036.01c-.016.008-.03.022-.03.022s-.02.016-.034.038c-.014.022-.024.048-.024.048s-.008.024-.01.046c-.002.022.002.042.002.042s.004.016.012.028c.008.012.018.02.018.02s.012.01.024.016c.012.006.024.01.024.01s.012.002.022.002c.01 0 .02-.002.02-.002s.008-.004.016-.01c.008-.006.014-.014.014-.014s.006-.008.01-.018c.004-.01.006-.02.006-.02s.002-.008 0-.016c-.002-.008-.006-.014-.006-.014s-.004-.006-.01-.01c-.006-.004-.012-.006-.012-.006s-.008-.002-.014-.002c-.006 0-.012.002-.012.002s-.006.002-.01.006c-.004.004-.008.01-.008.01s-.004.008-.004.014c0 .006.002.012.002.012s.002.004.006.006c.004.002.008.002.008.002s.004 0 .006-.002c.002-.002.004-.006.004-.006z" />
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
            <p className="text-xs text-muted-foreground">تسوّق أذكى… وفّر أكثر</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          <Link
            to="/privacy"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/60 text-xs font-bold hover:bg-secondary press-ripple transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> سياسة الخصوصية
          </Link>
          <Link
            to="/terms"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/60 text-xs font-bold hover:bg-secondary press-ripple transition"
          >
            <FileText className="w-3.5 h-3.5 text-primary" /> الشروط والأحكام
          </Link>
          <Link
            to="/delete-account"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/60 text-xs font-bold hover:bg-secondary press-ripple transition"
          >
            <UserMinus className="w-3.5 h-3.5 text-primary" /> حذف الحساب
          </Link>
        </nav>
      </div>
      <div className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            © {year} HkeeemAI — جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-2" aria-label="وسائل التواصل">
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
            <h1 className="truncate font-display font-black text-2xl md:text-3xl text-gold-shine">{title}</h1>
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
