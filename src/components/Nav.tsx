import { Link } from "@tanstack/react-router";
import { Sparkles, Home, ListChecks, MessageCircle, Tag, Ticket, Trophy, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const items = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/deals", label: "العروض", icon: Tag },
  { to: "/coupons", label: "كوبونات", icon: Ticket },
  { to: "/smart-list", label: "قائمة", icon: ListChecks },
  { to: "/rewards", label: "جوائز", icon: Trophy },
  { to: "/chat", label: "مساعد", icon: MessageCircle },
] as const;

export function TopBar() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-primary/15">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative w-10 h-10 rounded-2xl bg-secondary glow-gold flex items-center justify-center ring-1 ring-primary/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-gold opacity-25" />
            <Sparkles className="relative w-5 h-5 text-primary drop-shadow-[0_0_8px_oklch(0.77_0.13_85_/_0.9)]" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-black text-lg md:text-xl tracking-tight text-gold-shine">HkeeemAI</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">تسوّق أذكى… وفّر أكثر</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className="px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              activeProps={{ className: "px-3 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground glow-gold" }}
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-1.5 text-xs">
                <UserIcon className="w-3.5 h-3.5 text-primary" />
                <span className="max-w-[140px] truncate">{user.user_metadata?.full_name || user.email}</span>
              </div>
              <button
                onClick={async () => { await signOut(); toast.success("تم تسجيل الخروج"); }}
                className="p-2 rounded-xl hover:bg-secondary transition"
                aria-label="خروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-gold text-secondary px-3 py-2 text-xs font-bold glow-gold"
            >
              <LogIn className="w-3.5 h-3.5" />
              دخول
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function BottomBar() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-primary/15 pb-[env(safe-area-inset-bottom)]">
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
