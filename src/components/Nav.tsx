import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, Home, ListChecks, MessageCircle, Tag, Ticket, Trophy, LogIn, LogOut, User as UserIcon, Shield, Heart, Menu, ExternalLink, Map, Moon, Sun, Building2, Store, Car, ChevronDown, Scale, BarChart3, Megaphone, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/deals", label: "العروض", icon: Tag },
  { to: "/coupons", label: "كوبونات", icon: Ticket },
  { to: "/maps", label: "خريطتي", icon: Map },
  { to: "/smart-list", label: "قائمة", icon: ListChecks },
  { to: "/rewards", label: "جوائز", icon: Trophy },
  { to: "/chat", label: "مساعد", icon: MessageCircle },
] as const;

type SubItem = { to: string; label: string; icon: typeof Home; badge?: string };
type Group = { label: string; icon: typeof Home; items: SubItem[] };

const groups: Group[] = [
  {
    label: "متجر حكيم AI",
    icon: Store,
    items: [
      { to: "/stores", label: "المتاجر", icon: Store },
      { to: "/deals", label: "العروض", icon: Tag },
      { to: "/coupons", label: "الكوبونات", icon: Ticket },
    ],
  },
  {
    label: "معرض حكيم AI",
    icon: Car,
    items: [{ to: "/cars", label: "السيارات", icon: Car, badge: "AI" }],
  },
  {
    label: "مكتب حكيم AI",
    icon: Building2,
    items: [{ to: "/real-estate", label: "البحث العقاري", icon: Building2, badge: "AI" }],
  },
  {
    label: "ذكاء حكيم AI",
    icon: Sparkles,
    items: [
      { to: "/compare", label: "مقارنة الأسعار", icon: Scale },
      { to: "/analysis", label: "تحليل المتاجر", icon: BarChart3, badge: "AI" },
      { to: "/ads", label: "مولد الإعلانات", icon: Megaphone, badge: "AI" },
      { to: "/market", label: "سوق حكيم الموحد", icon: ShoppingBag },
    ],
  },
];


/** يحدد إن كان المسار الحالي يطابق رابط القائمة (مع دعم الصفحات الفرعية) */
function isPathActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function SidebarGroup({ group, pathname }: { group: Group; pathname: string }) {
  const hasActive = group.items.some((i) => isPathActive(pathname, i.to));
  const [open, setOpen] = useState(hasActive);
  // فتح تلقائي عند الانتقال لصفحة داخل القسم
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);
  const GroupIcon = group.icon;
  return (
    <div className="mt-2 border-t border-primary/10 pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-foreground/90 hover:bg-secondary transition-all"
      >
        <GroupIcon className="w-4.5 h-4.5 text-primary" />
        <span className="text-sm font-bold">{group.label}</span>
        <ChevronDown className={`mr-auto w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-1 pr-3">
          {group.items.map((it) => {
            const Icon = it.icon;
            const active = isPathActive(pathname, it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                preload="intent"
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "relative flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold glow-gold transition-all"
                    : "relative flex items-center gap-3 px-4 py-2.5 rounded-2xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all group"
                }
              >
                {active && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-primary-foreground/80" />
                )}
                <Icon className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm">{it.label}</span>
                {it.badge && !active && (
                  <span className="mr-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{it.badge}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const { user, signOut } = useAuth();
  const isStaff = useIsStaff(user?.id);
  const { isDark, toggle: toggleTheme } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  // استرجاع حالة القائمة المحفوظة بعد الترطيب (hydration)
  useEffect(() => {
    try {
      if (localStorage.getItem("hkeeem-sidebar-open") === "1") setMenuOpen(true);
    } catch { /* ignore */ }
  }, []);

  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open);
    try {
      localStorage.setItem("hkeeem-sidebar-open", open ? "1" : "0");
    } catch { /* ignore */ }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-primary/15">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-4">
          <Sheet open={menuOpen} onOpenChange={handleMenuOpenChange}>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-secondary rounded-xl transition-colors">
                <Menu className="w-5 h-5 text-primary" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col bg-background border-l border-primary/10">
              <SheetHeader className="text-right border-b border-primary/10 pb-4">
                <SheetTitle className="flex items-center gap-2 text-gold-shine font-display font-black text-xl">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center ring-1 ring-primary/30">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  HkeeemAI
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-6">
                <nav className="flex flex-col gap-2">
                  {items.map((it) => {
                    const Icon = it.icon;
                    const active = isPathActive(pathname, it.to);
                    return (
                      <Link
                        key={it.to}
                        to={it.to}
                        aria-current={active ? "page" : undefined}
                        className={
                          active
                            ? "relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-bold glow-gold transition-all"
                            : "relative flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all group"
                        }
                      >
                        {active && (
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary-foreground/80" />
                        )}
                        <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">{it.label}</span>
                        {it.to === "/maps" && !active && (
                          <span className="mr-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">جديد</span>
                        )}
                      </Link>
                    );
                  })}

                  {/* أقسام فرعية منضوية تفتح تلقائياً عند اختيار صفحة داخلها */}
                  {groups.map((g) => (
                    <SidebarGroup key={g.label} group={g} pathname={pathname} />
                  ))}
                </nav>
              </div>
              <SheetFooter className="mt-auto border-t border-primary/10 pt-6 pb-4">
                <div className="flex flex-col gap-4 w-full">
                  <div className="bg-secondary/50 p-4 rounded-2xl border border-primary/10">
                    <p className="text-[11px] text-muted-foreground leading-relaxed text-right">
                      يسعدني استقبال طلباتكم وعروضكم عبر رابط مكتبي العقاري، وسنقوم بخدمتكم في أقرب فرصة
                    </p>
                    <p className="text-[10px] font-bold text-primary mt-2 text-right">
                      (مؤسسة محسن لخدمات الاعمال)
                    </p>
                    <a 
                      href="https://dealapp.sa/ar/profile/67c08063ca5bafdb59e3d8d4?utm_source=visit_my_profile" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-gold text-secondary text-xs font-bold glow-gold hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      زيارة المكتب العقاري
                    </a>
                  </div>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

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
          {isStaff && (
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary px-3 py-2 text-xs font-bold"
            >
              <Shield className="w-3.5 h-3.5" />
              لوحة التحكم
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-secondary transition"
            aria-label={isDark ? "الوضع النهاري" : "الوضع الليلي"}
            title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
          >
            {isDark ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
          </button>
          {user ? (
            <>
              <Link
                to="/me"
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-secondary/60 px-3 py-2 text-xs font-bold hover:bg-secondary transition"
              >
                <Heart className="w-3.5 h-3.5 text-primary" />
                حسابي
              </Link>
              <div className="hidden md:flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-1.5 text-xs">
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
    </div>
    </header>
  );
}

function useIsStaff(userId: string | undefined) {
  const [staff, setStaff] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!userId) { setStaff(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", userId).then(({ data }) => {
      if (cancelled) return;
      const roles = (data ?? []).map((r) => r.role);
      setStaff(roles.some((r) => ["super_admin","admin","support","content_manager"].includes(r as string)));
    });
    return () => { cancelled = true; };
  }, [userId]);
  return staff;
}


export function BottomBar() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-primary/15 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-7">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className="flex flex-col items-center gap-1 py-2 text-muted-foreground text-[9px] relative"
              activeProps={{ className: "flex flex-col items-center gap-1 py-2 text-primary text-[9px] font-bold relative" }}
            >
              {it.to === "/maps" && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
              )}
              <Icon className="w-5 h-5" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
