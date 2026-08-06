import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, Home, ListChecks, MessageCircle, Tag, Ticket, Trophy, LogIn, LogOut, User as UserIcon, Shield, Heart, Menu, ExternalLink, Map, Building2, Store, Car, ChevronDown, ChevronLeft, ChevronRight, Contrast, Scale, BarChart3, Megaphone, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { VisionBadge } from "@/components/VisionBadge";
import { VisionBadgeSettings } from "@/components/VisionBadgeSettings";


import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
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
      { to: "/merchant", label: "بوابة التاجر", icon: Store, badge: "جديد" },
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
      { to: "/affiliate-setup", label: "ربط أمازون ونون", icon: Link2, badge: "دليل" },
    ],
  },
];


/** يحدد إن كان المسار الحالي يطابق رابط القائمة (مع دعم الصفحات الفرعية) */
function isPathActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function SidebarGroup({
  group,
  pathname,
  open,
  onToggle,
  shortcut,
  onNavigate,
}: {
  group: Group;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  shortcut?: number;
  onNavigate?: () => void;
}) {
  const GroupIcon = group.icon;
  const slug = group.label.replace(/\s+/g, "-");
  const panelId = `sidebar-group-panel-${slug}`;
  const buttonId = `sidebar-group-button-${slug}`;

  return (
    <div className="mt-2 border-t border-primary/10 pt-2">
      <button
        type="button"
        id={buttonId}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-foreground/90 hover:bg-secondary transition-all"
      >
        <GroupIcon className="w-4.5 h-4.5 text-primary" />
        <span className="text-sm font-bold">{group.label}</span>
        {shortcut && (
          <kbd className="text-[10px] font-mono text-foreground/50 border border-border rounded px-1">
            Alt+{shortcut}
          </kbd>
        )}
        <ChevronDown className={`mr-auto w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          id={panelId}
          role="group"
          aria-labelledby={buttonId}
          className="mt-1 flex flex-col gap-1 pr-3 list-none m-0 p-0"
        >

          {group.items.map((it) => {
            const Icon = it.icon;
            const active = isPathActive(pathname, it.to);
            return (
              <li key={it.to} className="contents">
              <Link
                to={it.to}
                preload="intent"
                onClick={() => onNavigate?.()}
                aria-current={active ? "page" : undefined}

                className={
                  active
                    ? "relative flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold glow-gold transition-all"
                    : "relative flex items-center gap-3 px-4 py-2.5 rounded-2xl text-foreground/80 hover:bg-secondary hover:text-foreground transition-all group"
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
              </li>
            );
          })}
        </ul>

      )}
    </div>
  );
}

export function TopBar() {
  const { user, signOut } = useAuth();
  const isStaff = useIsStaff(user?.id);
  
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarWide, setSidebarWide] = useState(false);

  const [highContrast, setHighContrast] = useState(false);

  // استرجاع حالة القائمة المحفوظة بعد الترطيب (hydration)
  useEffect(() => {
    try {
      if (localStorage.getItem("hkeeem-sidebar-open") === "1") setMenuOpen(true);
      if (localStorage.getItem("hkeeem-sidebar-wide") === "1") setSidebarWide(true);
      if (localStorage.getItem("hkeeem-sidebar-hc") === "1") setHighContrast(true);
    } catch { /* ignore */ }
  }, []);

  // القسم المفتوح حالياً داخل القائمة (يتبع المسار الحالي افتراضياً)
  const activeGroupIndex = groups.findIndex((g) => g.items.some((i) => isPathActive(pathname, i.to)));
  const [openGroup, setOpenGroup] = useState<number | null>(activeGroupIndex >= 0 ? activeGroupIndex : null);
  useEffect(() => {
    if (activeGroupIndex >= 0) setOpenGroup(activeGroupIndex);
  }, [activeGroupIndex]);

  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open);
    try {
      localStorage.setItem("hkeeem-sidebar-open", open ? "1" : "0");
    } catch { /* ignore */ }
    // ترجيع التركيز لزر القائمة بعد الإغلاق (حتى لو صار تنقل لقسم آخر)
    if (!open) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => menuTriggerRef.current?.focus());
      });
    }
  };

  // اختصارات لوحة المفاتيح: Ctrl/⌘+B لفتح/إغلاق القائمة، Alt+رقم لاختيار قسم، Alt+↑/↓ للتنقل بين الأقسام
  useEffect(() => {
    const isTyping = (el: EventTarget | null) => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;

      // فتح/إغلاق القائمة
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleMenuOpenChange(!menuOpen);
        return;
      }

      if (e.key === "Escape" && menuOpen) {
        e.preventDefault();
        handleMenuOpenChange(false);
        return;
      }


      if (!e.altKey || e.ctrlKey || e.metaKey) return;

      // Alt + 1..N لاختيار قسم مباشرة
      const num = parseInt(e.key, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= groups.length) {
        e.preventDefault();
        if (!menuOpen) handleMenuOpenChange(true);
        setOpenGroup(num - 1);
        return;
      }

      // Alt + ↑/↓ للتنقل بين الأقسام
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!menuOpen) handleMenuOpenChange(true);
        setOpenGroup((prev) => {
          const step = e.key === "ArrowDown" ? 1 : -1;
          if (prev === null) return e.key === "ArrowDown" ? 0 : groups.length - 1;
          return (prev + step + groups.length) % groups.length;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // إيماءات السحب على الجوال: سحب من الحافة اليمنى للفتح، وسحب لليمين للإغلاق
  useEffect(() => {
    const EDGE = 28;      // عرض منطقة الحافة التي تبدأ منها إيماءة الفتح
    const DISTANCE = 60;  // أقل مسافة أفقية تُعتبر سحبة
    const MAX_OFF_AXIS = 50;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let intent: "open" | "close" | null = null;

    const isMobile = () => window.innerWidth < 768;

    const onTouchStart = (e: TouchEvent) => {
      if (!isMobile() || e.touches.length !== 1) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      if (!menuOpen && startX >= window.innerWidth - EDGE) {
        intent = "open";
        tracking = true;
      } else {
        // الإغلاق صار بالنقر على الخلفية الداكنة بدل السحب
        tracking = false;
        intent = null;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking || !intent) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      tracking = false;
      if (dy > MAX_OFF_AXIS) { intent = null; return; }

      if (intent === "open" && dx <= -DISTANCE) handleMenuOpenChange(true);
      intent = null;
    };


    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [menuOpen]);

  // منع تمرير الصفحة خلف الـ overlay عندما تكون القائمة مفتوحة
  useEffect(() => {
    if (!menuOpen) return;
    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overscroll: body.style.overscrollBehavior,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overscrollBehavior = "none";
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overscrollBehavior = prev.overscroll;
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);


  const toggleSidebarWidth = () => {
    setSidebarWide((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("hkeeem-sidebar-wide", next ? "1" : "0");
      } catch { /* ignore */ }
      return next;
    });
  };

  // تنقل كامل بلوحة المفاتيح داخل القائمة: الأسهم و Home/End، وEnter/Space لتفعيل العنصر
  const handleNavKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const keys = ["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Spacebar"];
    if (!keys.includes(e.key)) return;

    const container = e.currentTarget.querySelector<HTMLElement>("nav") ?? e.currentTarget;
    const items = Array.from(
      container.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    ).filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;

    const current = document.activeElement as HTMLElement | null;
    const index = current ? items.indexOf(current) : -1;

    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      if (index === -1) return;
      // الروابط تعمل مع Enter تلقائياً؛ نتكفل بالمسافة وبأزرار الأقسام
      if (e.key === "Enter" && items[index].tagName === "A") return;
      e.preventDefault();
      items[index].click();
      return;
    }

    e.preventDefault();
    let next = 0;
    if (e.key === "ArrowDown") next = index < 0 ? 0 : (index + 1) % items.length;
    else if (e.key === "ArrowUp") next = index <= 0 ? items.length - 1 : index - 1;
    else if (e.key === "End") next = items.length - 1;
    items[next]?.focus();
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("hkeeem-sidebar-hc", next ? "1" : "0");
      } catch { /* ignore */ }
      return next;
    });
  };


  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-primary/15">
      <div className="relative max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
        <VisionBadge />

        <div className="flex items-center gap-4">
          <Sheet open={menuOpen} onOpenChange={handleMenuOpenChange} modal>
            <SheetTrigger asChild>
              <button
                ref={menuTriggerRef}
                aria-label="فتح القائمة الجانبية"
                aria-haspopup="dialog"
                aria-expanded={menuOpen}
                aria-controls="hkeeem-sidebar"
                className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-secondary rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Menu className="w-5 h-5 text-primary" />
              </button>
            </SheetTrigger>
            <SheetContent
              id="hkeeem-sidebar"
              side="right"
              role="dialog"
              aria-modal="true"
              aria-label="القائمة الجانبية"

              onKeyDown={handleNavKeyDown}
              onEscapeKeyDown={(e) => { e.preventDefault(); handleMenuOpenChange(false); }}
              onPointerDownOutside={() => handleMenuOpenChange(false)}
              onInteractOutside={() => handleMenuOpenChange(false)}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                menuTriggerRef.current?.focus();
              }}
              onOpenAutoFocus={(e) => {
                // حبس التركيز: ابدأ من أول رابط تنقل داخل القائمة
                e.preventDefault();
                const panel = e.currentTarget as HTMLElement;
                const first =
                  panel.querySelector<HTMLElement>('nav a[href], nav button:not([disabled])') ??
                  panel.querySelector<HTMLElement>(
                    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
                  );
                (first ?? panel).focus();
              }}
              data-sidebar-hc={highContrast ? "on" : "off"}
              className={
                (sidebarWide
                  ? "w-[300px] sm:w-[360px] max-w-[85vw] "
                  : "w-auto min-w-[190px] max-w-[260px] sm:max-w-[280px] ") +
                (highContrast
                  ? "bg-background/95 border-primary/40 "
                  : "bg-background/55 border-primary/15 ") +
                "sidebar-panel p-4 flex flex-col backdrop-blur-2xl border-l shadow-xl " +
                "transition-[width,max-width,background-color,border-color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] " +
                "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-400 data-[state=closed]:duration-250 data-[state=open]:ease-[cubic-bezier(0.22,1,0.36,1)]"
              }

            >
              <SheetHeader className="text-right border-b border-primary/10 pb-4">
                <SheetTitle className="flex items-center gap-2 text-gold-shine font-display font-black text-xl">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center ring-1 ring-primary/30">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  {sidebarWide && <span>HkeeemAI</span>}
                  <div className="mr-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={toggleHighContrast}
                      aria-pressed={highContrast}
                      aria-label={highContrast ? "إيقاف وضع التباين العالي" : "تفعيل وضع التباين العالي"}
                      title={highContrast ? "إيقاف وضع التباين العالي" : "تفعيل وضع التباين العالي"}
                      className={
                        "min-h-9 min-w-9 flex items-center justify-center rounded-lg transition-colors " +
                        (highContrast
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/70 hover:text-foreground hover:bg-secondary/60")
                      }
                    >
                      <Contrast className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleSidebarWidth}
                      aria-label={sidebarWide ? "تصغير القائمة" : "توسيع القائمة"}
                      title={sidebarWide ? "تصغير القائمة" : "توسيع القائمة"}
                      className="min-h-9 min-w-9 flex items-center justify-center rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      {sidebarWide ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                  </div>
                </SheetTitle>
              </SheetHeader>


              <div className="flex-1 overflow-y-auto py-6">
                <nav className="flex flex-col gap-2" aria-label="روابط القائمة الجانبية">
                  <ul className="flex flex-col gap-2 list-none m-0 p-0" role="list">
                  {items.map((it, i) => {
                    const Icon = it.icon;
                    const active = isPathActive(pathname, it.to);
                    return (
                      <li key={it.to} className="contents">
                      <Link
                        to={it.to}
                        onClick={() => handleMenuOpenChange(false)}
                        aria-current={active ? "page" : undefined}

                        style={{ animationDelay: `${60 + i * 35}ms` }}
                        className={
                          "sidebar-item " +
                          (active
                            ? "relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/90 text-primary-foreground font-bold transition-all duration-200 whitespace-nowrap"
                            : "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/80 hover:bg-secondary/60 hover:text-foreground hover:translate-x-[-2px] transition-all duration-200 group whitespace-nowrap")
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
                      </li>
                    );
                  })}

                  {/* أقسام فرعية منضوية تفتح تلقائياً عند اختيار صفحة داخلها */}
                  {groups.map((g, gi) => (
                    <li key={g.label} className="contents">
                    <SidebarGroup
                      group={g}
                      pathname={pathname}
                      open={openGroup === gi}
                      onToggle={() => setOpenGroup((prev) => (prev === gi ? null : gi))}
                      onNavigate={() => handleMenuOpenChange(false)}
                      shortcut={gi + 1}
                    />
                    </li>
                  ))}
                  </ul>




                  <p className="mt-3 px-4 text-[10px] text-foreground/60 leading-relaxed">
                    اختصارات: Ctrl/⌘+B لفتح وإغلاق القائمة · ↑/↓ للتنقل بين العناصر · Home/End للأول والأخير · Enter لفتح الرابط · Alt+رقم لاختيار قسم
                  </p>

                </nav>
              </div>
              <SheetFooter className="mt-auto border-t border-primary/10 pt-6 pb-4">
                <div className="flex flex-col gap-4 w-full">
                  <div className="bg-secondary/50 p-4 rounded-2xl border border-primary/10">
                    <p className="text-[11px] text-foreground/80 leading-relaxed text-right">
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

          <Link to="/" className="relative flex items-center gap-2.5 group">
          <div className="relative w-10 h-10 rounded-2xl bg-secondary glow-gold flex items-center justify-center ring-1 ring-primary/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-gold opacity-25" />
            <Sparkles className="relative w-5 h-5 text-primary drop-shadow-[0_0_8px_oklch(0.77_0.13_85_/_0.9)]" />
          </div>
          <div className="relative flex flex-col leading-tight">
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
          <VisionBadgeSettings className="hidden sm:inline-flex" />
          <ThemeSwitcher />


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
