import { 
  Outlet, 
  createRootRouteWithContext, 
  HeadContent, 
  Scripts, 
  useRouterState 
} from "@tanstack/react-router";
import type { ReactNode } from "@tanstack/react-router";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { LanguageProvider } from "@/lib/i18n";
import { StoreScopeProvider } from "@/lib/store-scope";

// استيراد ملف الـ CSS ليعود التصميم الأصلي الملون
import appCss from "../styles.css?url";

// استيراد المكونات الموجودة فعلاً في مجلد components
import Nav from "@/components/Nav";
import StoreScopeBar from "@/components/StoreScopeBar";
import Footer from "@/components/Footer";
import InstallHandler from "@/components/InstallHandler";
import { Toaster } from "sonner";
import NotificationPrompt from "@/components/NotificationPrompt";
import FeedbackSurvey from "@/components/FeedbackSurvey";
import PreviewErrorRecorder from "@/components/PreviewErrorRecorder";
import VisitorTracker from "@/components/VisitorTracker";
import DealAlerts from "@/components/DealAlerts";
import ScrollMemory from "@/components/ScrollMemory";
import { initGoogleAnalytics, trackPageView } from "@/lib/analytics";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HkeeemAI — تسوّق أذكى… وفّر أكثر" },
      { name: "description", content: "الذكاء الاقتصادي للمملكة: قرارات شراء أذكى في دقائق." },
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
      { rel: "stylesheet", href: appCss }, // ربط الـ CSS ليعود الشكل الجميل
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

          <Nav />
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
