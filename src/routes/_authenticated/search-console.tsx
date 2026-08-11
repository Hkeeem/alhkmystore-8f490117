import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Globe, RefreshCw, Search, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCrawlReport,
  inspectPages,
  listCrawlSnapshots,
} from "@/lib/search-console.functions";
import { MONITORED_PATHS } from "@/lib/search-console-paths";


export const Route = createFileRoute("/_authenticated/search-console")({
  component: SearchConsolePage,
  head: () => ({
    meta: [
      { title: "سجل الزحف والفهرسة | حكيم AI" },
      {
        name: "description",
        content:
          "لوحة إدارية تعرض سجلات الزحف والفهرسة من Google Search Console مع تنبيه عند انخفاض عدد الصفحات المفهرسة.",
      },
      { property: "og:title", content: "سجل الزحف والفهرسة | حكيم AI" },
      {
        property: "og:description",
        content: "حالة ملفات الخريطة وفهرسة الصفحات الأساسية مع تنبيهات الانخفاض.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
}

const COVERAGE_LABEL: Record<string, string> = {
  PASS: "مفهرسة",
  PARTIAL: "مفهرسة جزئياً",
  FAIL: "غير مفهرسة",
  NEUTRAL: "قيد المعالجة",
  ERROR: "تعذّر الفحص",
  VERDICT_UNSPECIFIED: "غير معروف",
};

const ERROR_LABEL: Record<string, string> = {
  search_console_not_connected: "اتصال Search Console غير مُفعّل لهذا المشروع.",
  no_verified_property: "لا توجد خاصية متحقق منها تغطي هذا الموقع.",
  property_not_verified: "الخاصية المختارة غير متحقق منها.",
};

function SearchConsolePage() {
  const fetchReport = useServerFn(getCrawlReport);
  const fetchSnapshots = useServerFn(listCrawlSnapshots);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);

  const snapshots = useQuery({
    queryKey: ["sc-snapshots"],
    queryFn: () => fetchSnapshots({ data: undefined }),
  });

  const report = useMutation({
    mutationFn: (selected: string | null) => fetchReport({ data: { siteUrl: selected } }),
    onSuccess: () => void snapshots.refetch(),
  });

  const runInspection = useServerFn(inspectPages);
  const [selectedPaths, setSelectedPaths] = useState<string[]>(MONITORED_PATHS.slice(0, 3));
  const inspection = useMutation({
    mutationFn: (paths: string[]) => runInspection({ data: { siteUrl, paths } }),
    onSuccess: () => void snapshots.refetch(),
  });

  const togglePath = (p: string) =>
    setSelectedPaths((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const data = report.data;


  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-black">
            <Search className="h-6 w-6 text-primary" />
            سجل الزحف والفهرسة
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            حالة ملفات الخريطة وفهرسة الصفحات الأساسية من Google Search Console، مع تنبيه فوري عند
            انخفاض عدد الصفحات المفهرسة بعد تحديثات العروض.
          </p>
        </div>
        <Button onClick={() => report.mutate(siteUrl)} disabled={report.isPending}>
          <RefreshCw className={`ml-2 h-4 w-4 ${report.isPending ? "animate-spin" : ""}`} />
          {report.isPending ? "جارٍ الفحص…" : "فحص الآن"}
        </Button>
      </header>

      {report.isPending && <Skeleton className="h-40 w-full rounded-2xl" />}

      {data?.status === "error" && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {ERROR_LABEL[data.error] ?? `تعذّر جلب البيانات (${data.error}).`}
          </CardContent>
        </Card>
      )}

      {data?.status === "selection_required" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">اختر خاصية Search Console</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.candidates.map((c) => (
              <Button
                key={c}
                variant={siteUrl === c ? "default" : "outline"}
                onClick={() => {
                  setSiteUrl(c);
                  report.mutate(c);
                }}
              >
                <Globe className="ml-2 h-4 w-4" />
                {c}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {data?.status === "ok" && (
        <div className="space-y-6">
          <Card
            className={
              data.alert.level === "drop"
                ? "border-destructive/50 bg-destructive/5"
                : data.alert.level === "sitemap_errors"
                  ? "border-amber-500/50"
                  : "border-primary/30"
            }
          >
            <CardContent className="flex items-start gap-3 p-4">
              {data.alert.level === "drop" ? (
                <TrendingDown className="mt-0.5 h-5 w-5 text-destructive" />
              ) : data.alert.level === "sitemap_errors" ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
              )}
              <div className="text-sm">
                <div className="font-bold">{data.alert.message}</div>
                {data.previous && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    آخر فحص سابق: {formatDate(data.previous.createdAt)} — كانت {data.previous.indexedUrls} صفحة
                    مفهرسة من الصفحات المراقبة.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "روابط مُرسلة بالخريطة", value: data.totals.submitted },
              { label: "روابط مفهرسة (الخريطة)", value: data.totals.indexed },
              { label: "صفحات مراقبة مفهرسة", value: `${data.totals.indexedUrls}/${data.totals.inspected}` },
              { label: "أخطاء الخريطة", value: data.totals.errors },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="mt-1 font-display text-2xl font-black">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ملفات الخريطة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.sitemaps.length === 0 && (
                <p className="text-sm text-muted-foreground">لم يتم إرسال أي ملف خريطة بعد.</p>
              )}
              {data.sitemaps.map((m) => (
                <div key={m.path} className="rounded-2xl border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold break-all">{m.path}</span>
                    <div className="flex gap-2">
                      {m.isPending && <Badge variant="secondary">قيد المعالجة</Badge>}
                      {m.errors > 0 && <Badge variant="destructive">{m.errors} خطأ</Badge>}
                      {m.warnings > 0 && <Badge variant="secondary">{m.warnings} تحذير</Badge>}
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                    <span>آخر إرسال: {formatDate(m.lastSubmitted)}</span>
                    <span>آخر تنزيل (زحف): {formatDate(m.lastDownloaded)}</span>
                    <span>روابط مُرسلة: {m.submitted}</span>
                    <span>روابط مفهرسة: {m.indexed}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">فهرسة الصفحات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.inspections.map((i) => (
                <div
                  key={i.url}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3 text-sm"
                >
                  <span className="break-all">{new URL(i.url).pathname}</span>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant={i.isIndexed ? "default" : "destructive"}>
                      {COVERAGE_LABEL[i.verdict] ?? i.verdict}
                    </Badge>
                    <span className="text-muted-foreground">{i.coverageState}</span>
                    <span className="text-muted-foreground">آخر زحف: {formatDate(i.lastCrawlTime)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">سجل الفحوصات السابقة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {snapshots.isLoading && <Skeleton className="h-16 w-full rounded-2xl" />}
          {!snapshots.isLoading && (snapshots.data?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">لا توجد فحوصات محفوظة بعد.</p>
          )}
          {(snapshots.data ?? []).map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3 text-xs"
            >
              <span>{formatDate(s.created_at)}</span>
              <span className="text-muted-foreground">
                مفهرسة: {s.indexed_urls}/{s.inspected_urls} — خريطة: {s.indexed}/{s.submitted} — أخطاء:{" "}
                {s.sitemap_errors}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
