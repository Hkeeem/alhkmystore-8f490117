import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { TopBar, BottomBar } from "@/components/Nav";
import { StoreScopeProvider } from "@/lib/store-scope";
import { StoreScopeBar } from "@/components/StoreScopeBar";
import { InstallHandler } from "@/components/InstallHandler";
import { ScrollMemory } from "@/components/ScrollMemory";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { FeedbackSurvey } from "@/components/FeedbackSurvey";
import { LanguageProvider } from "@/lib/i18n";
import { DealAlerts } from "@/components/DealAlerts";
import { VisitorTracker } from "@/components/VisitorTracker";
import { PreviewErrorRecorder } from "@/components/PreviewErrorRecorder";

import { InvalidLinkFallback } from "@/components/InvalidLinkFallback";
import { deals, discountPercent } from "@/data/deals";
import { initGoogleAnalytics, trackPageView } from "@/lib/ga4";

function NotFoundComponent() {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  let suggestion = { to: "/", label: "الصفحة الرئيسية", hint: "أفضل العروض اليوم", emoji: "🏠" };
  let backTo = { to: "/", label: "الرئيسية" };
  if (path.startsWith("/deal") || path.startsWith("/offers")) {
    const top = [...deals].sort((a, b) => discountPercent(b) - discountPercent(a))[0];
    suggestion = {
      to: `/deals/${top.id}`,
      label: top.title,
      hint: `خصم ${discountPercent(top)}٪`,
      emoji: top.image,
    };
    backTo = { to: "/deals", label: "كل العروض" };
  } else if (path.startsWith("/coupon")) {
    suggestion = {
      to: "/coupons",
      label: "قائمة الكوبونات",
      hint: "أحدث الأكواد المتاحة",
      emoji: "🎟️",
    };
    backTo = { to: "/coupons", label: "الكوبونات" };
  } else if (path.startsWith("/reward")) {
    suggestion = { to: "/rewards", label: "قائمة الجوائز", hint: "استبدل نقاطك", emoji: "🎁" };
    backTo = { to: "/rewards", label: "الجوائز" };
  } else if (path.startsWith("/smart") || path.startsWith("/list")) {
    suggestion = {
      to: "/smart-list",
      label: "قائمة التسوق الذكية",
      hint: "ابنِ قائمتك بالذكاء الاصطناعي",
      emoji: "🛒",
    };
    backTo = { to: "/", label: "الرئيسية" };
  } else if (path.startsWith("/chat") || path.startsWith("/makki")) {
    suggestion = {
      to: "/chat",
      label: "حكيم — مساعدك الذكي",
      hint: "اسأله عن أي عرض",
      emoji: "💬",
    };
    backTo = { to: "/", label: "الرئيسية" };
  }
  return (
    <InvalidLinkFallback
      icon="🧭"
      title="الرابط غير موجود"
      message="الصفحة اللي تدور عليها ما لقيناها. حوّلناك لأقرب صفحة متاحة."
      suggestion={suggestion}
      backTo={backTo}
    />
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold">صار خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-muted-foreground">جرّب تحدّث الصفحة.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HkeeemAI — تسوّق أذكى… وفّر أكثر" },
      {
        name: "description",
        content:
          "HkeeemAI — منصة سعودية ذكية تجمع أفضل العروض والكوبونات ومقارنة الأسعار والعقارات والسيارات والخرائط في مكان واحد، مدعومة بالذكاء الاصطناعي.",
      },
      { name: "theme-color", content: "#D4AF37" },
      { property: "og:title", content: "HkeeemAI — تسوّق أذكى… وفّر أكثر" },
      {
        property: "og:description",
        content: "الذكاء الاقتصادي للمملكة: قرارات شراء أذكى في دقائق.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "google-site-verification",
        content: "AC4RPtk9MfT0OS3OiEocjDzCHnXq8gZ2ujMtswOKir4",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/hkeeem_192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "حكيم AI",
              url: "https://alhkmystore.lovable.app/",
              logo: "https://alhkmystore.lovable.app/hkeeem_512.png",
            },
            {
              "@type": "WebSite",
              name: "حكيم AI",
              url: "https://alhkmystore.lovable.app/",
              inLanguage: "ar",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://alhkmystore.lovable.app/chat?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    initGoogleAnalytics();
    trackPageView(pathname);
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <StoreScopeProvider>
        <div className="min-h-screen pb-20 md:pb-0">
          <a href="#main-content" className="skip-link">
            تخطي إلى المحتوى الرئيسي / Skip to content
          </a>
          <PreviewErrorRecorder />
          <VisitorTracker />
          <DealAlerts />

          <TopBar />
          <StoreScopeBar />
          <ScrollMemory />
          <div
            key={pathname}
            id="main-content"
            tabIndex={-1}
            className="page-transition outline-none"
          >
            <Outlet />
          </div>
          <Footer />
          <BottomBar />
          <InstallHandler />
          <Toaster position="top-center" richColors closeButton dir="rtl" />
          <NotificationPrompt />
          <FeedbackSurvey />
        </div>
        </StoreScopeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
