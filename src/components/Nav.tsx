import { Link } from "@tanstack/react-router";
import { Sparkles, Home, ListChecks, MessageCircle, Tag, Ticket, Trophy } from "lucide-react";

const items = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/deals", label: "العروض", icon: Tag },
  { to: "/coupons", label: "كوبونات", icon: Ticket },
  { to: "/smart-list", label: "قائمة", icon: ListChecks },
  { to: "/rewards", label: "جوائز", icon: Trophy },
  { to: "/chat", label: "مساعد", icon: MessageCircle },
] as const;

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-hero shadow-glow flex items-center justify-center ring-1 ring-primary/40">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-black text-lg tracking-tight">Hkeeem <span className="text-primary">AI</span></span>
            <span className="text-[10px] text-muted-foreground -mt-1">الذكاء الاقتصادي</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className="px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              activeProps={{ className: "px-3 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground" }}
            >
              {it.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function BottomBar() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-6">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className="flex flex-col items-center gap-1 py-3 text-muted-foreground text-[10px]"
              activeProps={{ className: "flex flex-col items-center gap-1 py-3 text-primary text-[10px] font-bold" }}
            >
              <Icon className="w-5 h-5" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
