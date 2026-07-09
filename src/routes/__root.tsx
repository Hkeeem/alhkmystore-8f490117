import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { TopBar, BottomBar } from "@/components/Nav";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-black text-primary">404</h1>
        <h2 className="mt-4 text-xl font-bold">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">الرابط اللي تدور عليه ما لقيناه.</p>
        <a href="/" className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">العودة للرئيسية</a>
      </div>
    </div>
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
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >إعادة المحاولة</button>
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
      { title: "وفّر - أفضل عروض المملكة في مكان واحد" },
      { name: "description", content: "تطبيق ذكي يجمع لك أفضل عروض السوبرماركت والمطاعم والإلكترونيات والصيدليات في المملكة العربية السعودية، ويرتّبها بالذكاء الاصطناعي." },
      { name: "theme-color", content: "#1f5c3a" },
      { property: "og:title", content: "وفّر - أفضل عروض المملكة" },
      { property: "og:description", content: "كل عروض المملكة في مكان واحد، مرتّبة بالذكاء الاصطناعي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen pb-20 md:pb-0">
        <TopBar />
        <Outlet />
        <BottomBar />
      </div>
    </QueryClientProvider>
  );
}
