import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  Home,
  ListChecks,
  MessageCircle,
  Tag,
  Ticket,
  Trophy,
  LogIn,
  LogOut,
  User as UserIcon,
  Shield,
  Heart,
  Menu,
  ExternalLink,
  Map,
  Building2,
  Store,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Contrast,
  Scale,
  BarChart3,
  Megaphone,
  ShoppingBag,
  Link2,
  ShieldCheck,
  Palette,
  RefreshCw,
  Tags,
  Crown,
  Bug,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { VisionBadge } from "@/components/VisionBadge";
import { VisionBadgeSettings } from "@/components/VisionBadgeSettings";
import { useAppearance } from "@/hooks/use-appearance";
import { useI18n, type TKey } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import hLogo from "@/assets/h-logo.png";

const items = [
  { to: "/", key: "nav.home", icon: Home },
  { to: "/deals", key: "nav.deals", icon: Tag },
  { to: "/coupons", key: "nav.coupons", icon: Ticket },
  { to: "/maps", key: "nav.maps", icon: Map },
  { to: "/smart-list", key: "nav.list", icon: ListChecks },
  { to: "/rewards", key: "nav.rewards", icon: Trophy },
  { to: "/chat", key: "nav.assistant", icon: MessageCircle },
] as const;

type SubItem = { to: string; key: TKey; icon: typeof Home; badgeKey?: TKey };
type Group = { key: TKey; icon: typeof Home; items: SubItem[] };

const groups: Group[] = [
  {
    key: "group.store",
    icon: Store,
    items: [
      { to: "/stores", key: "item.stores", icon: Store },
      { to: "/showroom", key: "item.showroom", icon: Sparkles, badgeKey: "nav.new" },
      { to: "/shop", key: "item.shop", icon: ShoppingBag, badgeKey: "nav.new" },
      { to: "/deals", key: "item.deals", icon: Tag },
      { to: "/coupons", key: "item.coupons", icon: Ticket },
      { to: "/merchant", key: "item.merchant", icon: Store, badgeKey: "nav.new" },
    ],
  },
  {
    key: "group.showroom",
    icon: Sparkles,
    items: [
      { to: "/hkeeem-showroom", key: "item.showroom", icon: Sparkles },
      { to: "/hkeeem-shopping", key: "item.shopping", icon: ShoppingBag, badgeKey: "nav.new" },
    ],
  },
  {
    key: "group.office",
    icon: Building2,
    items: [
      { to: "/office", key: "item.office", icon: Building2, badgeKey: "nav.new" },
      { to: "/real-estate", key: "item.realEstate", icon: Building2 },
    ],
  },
  {
    key: "group.intelligence",
    icon: Sparkles,
    items: [
      { to: "/compare", key: "item.compare", icon: Scale },
      { to: "/analysis", key: "item.analysis", icon: BarChart3 },
      { to: "/ads", key: "item.ads", icon: Megaphone },
      { to: "/market", key: "item.market", icon: ShoppingBag },
      { to: "/pro", key: "item.pro", icon: Crown, badgeKey: "nav.new" },
      { to: "/affiliate-setup", key: "item.affiliate", icon: Link2, badgeKey: "nav.guide" },
      { to: "/agents", key: "item.agents", icon: ShieldCheck, badgeKey: "nav.new" },
      { to: "/settings", key: "item.settings", icon: Palette, badgeKey: "nav.new" },
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
  const { t } = useI18n();
  const GroupIcon = group.icon;
  const slug = group.key.replace(/[.\s]+/g, "-");
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
        className={`group/sidebar w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-right transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
          open
            ? "bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_26%,transparent)]"
            : "text-foreground/90 hover:bg-secondary/80 hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-all duration-200 group-hover/sidebar:bg-primary group-hover/sidebar:text-primary-foreground group-hover/sidebar:shadow-[0_0_14px_color-mix(in_oklab,var(--color-primary)_36%,transparent)] group-active/sidebar:scale-95">
          <GroupIcon
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 group-hover/sidebar:scale-110"
          />
        </span>
        <span className="min-w-0 text-sm font-bold">{t(group.key)}</span>
        {shortcut && (
          <kbd className="hidden rounded border border-border/80 px-1.5 py-0.5 text-[10px] font-mono text-foreground/50 sm:inline-block">
            Alt+{shortcut}
          </kbd>
        )}
        <ChevronDown
          aria-hidden="true"
          className={`mr-auto h-4 w-4 shrink-0 text-primary transition-transform duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!open}
        inert={!open}
        className={`grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          open
            ? "grid-rows-[1fr] translate-y-0 opacity-100"
            : "pointer-events-none grid-rows-[0fr] -translate-y-1 opacity-0"
        }`}
      >
        <ul className="min-h-0 overflow-hidden mt-1 flex flex-col gap-1 pr-3 list-none m-0 p-0">
          {group.items.map((it, index) => {
            const Icon = it.icon;
            const active = isPathActive(pathname, it.to);
            return (
              <li key={it.to} className="contents">
                <Link
                  to={it.to}
                  preload="intent"
                  tabIndex={open ? 0 : -1}
                  onClick={() => onNavigate?.()}
                  aria-current={active ? "page" : undefined}
                  style={{ transitionDelay: open ? `${index * 25}ms` : "0ms" }}
                  className={
                    active
                      ? "relative flex items-center gap-3 rounded-2xl bg-primary px-4 py-2.5 font-bold text-primary-foreground shadow-[0_6px_18px_color-mix(in_oklab,var(--color-primary)_24%,transparent)] transition-all duration-200"
                      : "group relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-foreground/80 transition-all duration-200 hover:bg-primary/10 hover:text-foreground hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_18%,transparent)] hover:translate-x-[-2px] active:scale-[0.98]"
                  }
                >
                  {active && (
                    <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary-foreground/80" />
                  )}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${active ? "bg-primary-foreground/15" : "bg-secondary/70 group-hover:bg-primary/15"}`}
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                    />
                  </span>
                  <span className="text-sm">{t(it.key)}</span>
                  {it.badgeKey && !active && (
                    <span className="mr-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {t(it.badgeKey)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function TopBar() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  useAppearance();
  const isStaff = useIsStaff(user?.id);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarWide, setSidebarWide] = useState(false);

  const [highContrast, setHighContrast] = useState(false);

  // استرجاع حالة القائمة المحفوظة بعد الترطيب (hydration)
  useEffect(() => {
    try {
      if (localStorage.getItem("hkeeem-sidebar-open") === "1") setMenuOpen(true);
      if (localStorage.getItem("hkeeem-sidebar-wide") === "1") setSidebarWide(true);
      if (localStorage.getItem("hkeeem-sidebar-hc") === "1") setHighContrast(true);
    } catch {
      /* ignore */
    }
  }, []);

  // القسم المفتوح حالياً داخل القائمة (يتبع المسار الحالي افتراضياً)
  const activeGroupIndex = groups.findIndex((g) =>
    g.items.some((i) => isPathActive(pathname, i.to)),
  );
  const [openGroup, setOpenGroup] = useState<number | null>(
    activeGroupIndex >= 0 ? activeGroupIndex : null,
  );
  useEffect(() => {
    if (activeGroupIndex >= 0) setOpenGroup(activeGroupIndex);
  }, [activeGroupIndex]);

  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open);
    try {
      localStorage.setItem("hkeeem-sidebar-open", open ? "1" : "0");
    } catch {
      /* ignore */
    }
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
    const EDGE = 28; // عرض منطقة الحافة التي تبدأ منها إيماءة الفتح
    const DISTANCE = 60; // أقل مسافة أفقية تُعتبر سحبة
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
      if (dy > MAX_OFF_AXIS) {
        intent = null;
        return;
      }

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
      } catch {
        /* ignore */
      }
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
      container.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
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
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-primary/15">
      <div className="relative max-w-6xl mx-auto flex items-center justify-between gap-2 px-3 sm:px-4 h-16 overflow-hidden">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Sheet open={menuOpen} onOpenChange={handleMenuOpenChange} modal>
            <SheetTrigger asChild>
              <button
                ref={menuTriggerRef}
                aria-label={t("nav.menu")}
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
              aria-label={t("nav.sidebar")}

              onKeyDown={handleNavKeyDown}
              onEscapeKeyDown={(e) => {
                e.preventDefault();
                handleMenuOpenChange(false);
              }}
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
                  panel.querySelector<HTMLElement>("nav a[href], nav button:not([disabled])") ??
                  panel.querySelector<HTMLElement>(
                    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
                  );
                (first ?? panel).focus();
              }}
              data-sidebar-hc={highContrast ? "on" : "off"}
              className={
                (sidebarWide
                  ? "w-[290px] sm:w-[340px] max-w-[84vw] "
                  : "w-[236px] sm:w-[258px] max-w-[78vw] ") +
                (highContrast
                  ? "bg-background/95 border-primary/40 "
                  : "bg-background/55 border-primary/15 ") +
                "sidebar-panel p-3 flex flex-col backdrop-blur-2xl border-l shadow-xl " +
                "transition-[width,max-width,background-color,border-color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] " +
                "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-400 data-[state=closed]:duration-250 data-[state=open]:ease-[cubic-bezier(0.22,1,0.36,1)]"
              }
            >
              <SheetHeader className="text-right border-b border-primary/15 pb-3">
                <SheetTitle className="flex items-center gap-2 text-gold-shine font-display font-black text-xl">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center ring-1 ring-primary/30">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <span className="truncate">HkeeemAI</span>
                  <div className="mr-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={toggleHighContrast}
                      aria-pressed={highContrast}
                      aria-label={
                        highContrast ? "إيقاف وضع التباين العالي" : "تفعيل وضع التباين العالي"
                      }
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
                      {sidebarWide ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronLeft className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="sm:hidden pt-3">
                <ThemeSwitcher className="w-full justify-center" />
              </div>

              <div className="flex-1 overflow-y-auto py-5">
                <nav className="flex flex-col gap-2" aria-label="روابط القائمة الجانبية">
                  <p className="px-3 pb-2 text-[11px] font-bold tracking-wide text-foreground/50">
                    التنقل السريع
                  </p>
                  <ul className="flex flex-col gap-1.5 list-none m-0 p-0" role="list">
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
                            <span className="text-sm">{t(it.key)}</span>
                            {it.to === "/maps" && !active && (
                              <span className="mr-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                {t("nav.new")}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}

                    {/* أقسام فرعية منضوية تفتح تلقائياً عند اختيار صفحة داخلها */}
                    {groups.map((g, gi) => (
                      <li key={g.key} className="contents">
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

                    <li className="contents">
                      <Link
                        to="/social-offers"
                        onClick={() => handleMenuOpenChange(false)}
                        aria-current={isPathActive(pathname, "/social-offers") ? "page" : undefined}
                        className={
                          "sidebar-item " +
                          (isPathActive(pathname, "/social-offers")
                            ? "relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/90 text-primary-foreground font-bold transition-all duration-200 whitespace-nowrap"
                            : "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/80 hover:bg-secondary/60 hover:text-foreground hover:translate-x-[-2px] transition-all duration-200 group whitespace-nowrap")
                        }
                      >
                        {isPathActive(pathname, "/social-offers") && (
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary-foreground/80" />
                        )}
                        <Megaphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">عروض السوشال ميديا</span>
                      </Link>
                    </li>

                    <li className="contents">
                      <Link
                        to="/sync-partners"
                        onClick={() => handleMenuOpenChange(false)}
                        aria-current={isPathActive(pathname, "/sync-partners") ? "page" : undefined}
                        className={
                          "sidebar-item " +
                          (isPathActive(pathname, "/sync-partners")
                            ? "relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/90 text-primary-foreground font-bold transition-all duration-200 whitespace-nowrap"
                            : "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/80 hover:bg-secondary/60 hover:text-foreground hover:translate-x-[-2px] transition-all duration-200 group whitespace-nowrap")
                        }
                      >
                        {isPathActive(pathname, "/sync-partners") && (
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary-foreground/80" />
                        )}
                        <RefreshCw className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">سجل المزامنة والشركاء</span>
                      </Link>
                    </li>

                    {isStaff && (
                      <li className="contents">
                        <Link
                          to="/admin"
                          onClick={() => handleMenuOpenChange(false)}
                          aria-current={isPathActive(pathname, "/admin") ? "page" : undefined}
                          className={
                            "sidebar-item mt-2 " +
                            (isPathActive(pathname, "/admin")
                              ? "relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/90 text-primary-foreground font-bold transition-all duration-200 whitespace-nowrap"
                              : "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/80 hover:bg-secondary/60 hover:text-foreground hover:translate-x-[-2px] transition-all duration-200 group whitespace-nowrap")
                          }
                        >
                          {isPathActive(pathname, "/admin") && (
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary-foreground/80" />
                          )}
                          <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-sm">{t("item.admin")}</span>
                        </Link>
                      </li>
                    )}

                    {isStaff && (
                      <li className="contents">
                        <Link
                          to="/sync-log"
                          onClick={() => handleMenuOpenChange(false)}
                          aria-current={isPathActive(pathname, "/sync-log") ? "page" : undefined}
                          className={
                            "sidebar-item " +
                            (isPathActive(pathname, "/sync-log")
                              ? "relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/90 text-primary-foreground font-bold transition-all duration-200 whitespace-nowrap"
                              : "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/80 hover:bg-secondary/60 hover:text-foreground hover:translate-x-[-2px] transition-all duration-200 group whitespace-nowrap")
                          }
                        >
                          {isPathActive(pathname, "/sync-log") && (
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary-foreground/80" />
                          )}
                          <RefreshCw className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-sm">{t("item.syncLog")}</span>
                          <span className="mr-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            {t("nav.new")}
                          </span>
                        </Link>
                      </li>
                    )}

                    {isStaff && (
                      <li className="contents">
                        <Link
                          to="/build-errors"
                          onClick={() => handleMenuOpenChange(false)}
                          aria-current={
                            isPathActive(pathname, "/build-errors") ? "page" : undefined
                          }
                          className={
                            "sidebar-item " +
                            (isPathActive(pathname, "/build-errors")
                              ? "relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/90 text-primary-foreground font-bold transition-all duration-200 whitespace-nowrap"
                              : "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/80 hover:bg-secondary/60 hover:text-foreground hover:translate-x-[-2px] transition-all duration-200 group whitespace-nowrap")
                          }
                        >
                          {isPathActive(pathname, "/build-errors") && (
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary-foreground/80" />
                          )}
                          <Bug className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-sm">{t("item.buildErrors")}</span>
                        </Link>
                      </li>
                    )}

                    {isStaff && (
                      <li className="contents">
                        <Link
                          to="/deals-admin"
                          onClick={() => handleMenuOpenChange(false)}
                          aria-current={isPathActive(pathname, "/deals-admin") ? "page" : undefined}
                          className={
                            "sidebar-item " +
                            (isPathActive(pathname, "/deals-admin")
                              ? "relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/90 text-primary-foreground font-bold transition-all duration-200 whitespace-nowrap"
                              : "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/80 hover:bg-secondary/60 hover:text-foreground hover:translate-x-[-2px] transition-all duration-200 group whitespace-nowrap")
                          }
                        >
                          <Tags className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-sm">لوحة عروض التجّار</span>
                        </Link>
                      </li>
                    )}

                    {isStaff && (
                      <li className="contents">
                        <Link
                          to="/visitors"
                          onClick={() => handleMenuOpenChange(false)}
                          aria-current={isPathActive(pathname, "/visitors") ? "page" : undefined}
                          className={
                            "sidebar-item " +
                            (isPathActive(pathname, "/visitors")
                              ? "relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/90 text-primary-foreground font-bold transition-all duration-200 whitespace-nowrap"
                              : "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/80 hover:bg-secondary/60 hover:text-foreground hover:translate-x-[-2px] transition-all duration-200 group whitespace-nowrap")
                          }
                        >
                          <RefreshCw className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-sm">الزوار ومساراتهم</span>
                        </Link>
                      </li>
                    )}

                    {isStaff && (
                      <li className="contents">
                        <Link
                          to="/noon-settings"
                          onClick={() => handleMenuOpenChange(false)}
                          aria-current={
                            isPathActive(pathname, "/noon-settings") ? "page" : undefined
                          }
                          className={
                            "sidebar-item " +
                            (isPathActive(pathname, "/noon-settings")
                              ? "relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/90 text-primary-foreground font-bold transition-all duration-200 whitespace-nowrap"
                              : "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/80 hover:bg-secondary/60 hover:text-foreground hover:translate-x-[-2px] transition-all duration-200 group whitespace-nowrap")
                          }
                        >
                          <RefreshCw className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-sm">إعدادات نون</span>
                        </Link>
                      </li>
                    )}
                  </ul>

                  <p className="mt-3 px-4 text-[10px] text-foreground/60 leading-relaxed">
                    اختصارات: Ctrl/⌘+B لفتح وإغلاق القائمة · ↑/↓ للتنقل بين العناصر · Home/End للأول
                    والأخير · Enter لفتح الرابط · Alt+رقم لاختيار قسم
                  </p>
                </nav>
              </div>
              <SheetFooter className="mt-auto border-t border-primary/10 pt-6 pb-4">
                <div className="flex flex-col gap-4 w-full">
                  <div className="bg-secondary/50 p-4 rounded-2xl border border-primary/10">
                    <p className="text-[11px] text-foreground/80 leading-relaxed text-right">
                      يسعدني استقبال طلباتكم وعروضكم عبر رابط مكتبي العقاري، وسنقوم بخدمتكم في أقرب
                      فرصة
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

          <Link to="/" className="relative flex items-center gap-2.5 group isolate">
            <span
              role="link"
              aria-label="مساعد حكيم AI"
              title="مساعد حكيم AI"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate({ to: "/chat", search: { q: "" } });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate({ to: "/chat", search: { q: "" } });
                }
              }}
              tabIndex={0}
              className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-gradient-to-br from-background to-background/80 flex items-center justify-center ring-2 ring-[oklch(0.78_0.18_80)] shadow-[0_0_16px_oklch(0.78_0.18_80_/_0.55)] overflow-hidden cursor-pointer transition-transform hover:scale-110 active:scale-95"
            >
              <img
                src={hLogo}
                alt="شعار حكيم AI"
                className="h-full w-full object-cover select-none"
                loading="eager"
              />
            </span>
            <div className="relative flex min-w-0 flex-col leading-tight px-1.5 sm:px-2 py-0.5 rounded-xl bg-background/70 backdrop-blur-sm">
              <span className="relative z-10 font-display font-black text-base sm:text-lg md:text-xl tracking-tight text-gold-shine truncate drop-shadow-[0_1px_2px_var(--background)]">
                HkeeemAI
              </span>
              <span className="relative z-10 hidden sm:block text-[10px] text-muted-foreground -mt-0.5 drop-shadow-[0_1px_2px_var(--background)]">
                {t("nav.tagline")}
              </span>
            </div>
            <VisionBadge />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className="px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                activeProps={{
                  className:
                    "px-3 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground glow-gold",
                }}
              >
                {t(it.key)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2 mr-auto shrink-0">
            {isStaff && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary px-3 py-2 text-xs font-bold"
              >
                <Shield className="w-3.5 h-3.5" />
                {t("nav.dashboard")}
              </Link>
            )}
            <LanguageSwitcher />
            <VisionBadgeSettings className="hidden sm:inline-flex" />
            <ThemeSwitcher className="hidden sm:flex" />

            {user ? (
              <>
                <Link
                  to="/me"
                  className="hidden sm:flex items-center gap-1.5 rounded-xl bg-secondary/60 px-3 py-2 text-xs font-bold hover:bg-secondary transition"
                >
                  <Heart className="w-3.5 h-3.5 text-primary" />
                  {t("nav.account")}
                </Link>
                <div className="hidden md:flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-1.5 text-xs">
                  <UserIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="max-w-[140px] truncate">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    await signOut();
                    toast.success(t("nav.loggedOut"));
                  }}
                  className="p-2 rounded-xl hover:bg-secondary transition"
                  aria-label={t("nav.logout")}
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
                {t("nav.login")}
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
    if (!userId) {
      setStaff(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (cancelled) return;
        const roles = (data ?? []).map((r) => r.role);
        setStaff(
          roles.some((r) =>
            ["super_admin", "admin", "support", "content_manager"].includes(r as string),
          ),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return staff;
}

export function BottomBar() {
  const { t } = useI18n();
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
              activeProps={{
                className:
                  "flex flex-col items-center gap-1 py-2 text-primary text-[9px] font-bold relative",
              }}
            >
              {it.to === "/maps" && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
              )}
              <Icon className="w-5 h-5" />
              <span>{t(it.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
