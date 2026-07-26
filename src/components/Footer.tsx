import { Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, FileText, UserMinus } from "lucide-react";

export const SUPPORT_EMAIL = "support@alhkmy.store";

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
        <p className="max-w-6xl mx-auto px-4 py-4 text-[11px] text-muted-foreground">
          © {year} HkeeemAI — جميع الحقوق محفوظة. للتواصل: {SUPPORT_EMAIL}
        </p>
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
