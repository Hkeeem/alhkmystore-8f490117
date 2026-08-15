import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Clock, Globe, RefreshCw, Search, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCrawlReport,
  getSnapshotSchedule,
  inspectPages,
  listCrawlSnapshots,
  setSnapshotSchedule,
} from "@/lib/search-console.functions";
import { MONITORED_PATHS } from "@/lib/search-console-paths";
import { DropAlerts } from "@/components/admin/DropAlerts";
import { IndexingTrendCharts } from "@/components/admin/IndexingTrendCharts";
import { SearchConsoleExport } from "@/components/admin/SearchConsoleExport";


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

const INTERVAL_OPTIONS = [
  { label: "كل 3 ساعات", value: "20 */3 * * *" },
  { label: "كل 6 ساعات", value: "20 */6 * * *" },
  { label: "كل 12 ساعة", value: "20 */12 * * *" },
  { label: "يومياً", value: "20 3 * * *" },
];

function SnapshotSchedulePanel() {
  const readSchedule = useServerFn(getSnapshotSchedule);
  const writeSchedule = useServerFn(setSnapshotSchedule);

  const schedule = useQuery({
    queryKey: ["sc-schedule"],
    queryFn: () => readSchedule({ data: undefined }),
  });

  const save = useMutation({
    mutationFn: (vars: { schedule: string; active: boolean }) => writeSchedule({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("تم تحديث الجدولة التلقائية");
        void schedule.refetch();
      } else {
        toast.error(res.reason);
      }
    },
    onError: () => toast.error("تعذّر تحديث الجدولة"),
  });

  const info = schedule.data?.ok ? schedule.data.schedule : null;
  const current = info?.schedule ?? "20 */6 * * *";
  const active = info?.active !== false;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          التحديث التلقائي لبيانات Search Console
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {schedule.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !info?.exists ? (
          <p className="text-sm text-muted-foreground">لم يتم إنشاء المهمة المجدولة بعد.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={active ? "default" : "secondary"}>{active ? "مُفعّلة" : "متوقفة"}</Badge>
              <span className="text-muted-foreground">آخر تشغيل: {formatDate(info.lastRunAt ?? null)}</span>
              {info.lastStatus && <Badge variant="outline">{info.lastStatus}</Badge>}
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERVAL_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={current === opt.value ? "default" : "outline"}
                  disabled={save.isPending}
                  onClick={() => save.mutate({ schedule: opt.value, active: true })}
                >
                  {opt.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                disabled={save.isPending}
                onClick={() => save.mutate({ schedule: current, active: !active })}
              >
                {active ? "إيقاف مؤقت" : "إعادة التشغيل"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              تجلب المهمة أحدث بيانات الفهرسة وخرائط الموقع وتحفظها تلقائياً كلقطة جديدة في السجل، مع تنبيه الفريق عند
              انخفاض عدد الصفحات المفهرسة.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const BASELINE_OPTIONS = [
  { value: "auto" as const, label: "تلقائي" },
  { value: "avg7" as const, label: "متوسط آخر 7 فحوصات" },
  { value: "last" as const, label: "آخر لقطة فقط" },
];

function SearchConsolePage() {
  const fetchReport = useServerFn(getCrawlReport);
  const fetchSnapshots = useServerFn(listCrawlSnapshots);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<"auto" | "avg7" | "last">("auto");

  const snapshots = useQuery({
    queryKey: ["sc-snapshots"],
    queryFn: () => fetchSnapshots({ data: undefined }),
  });

  const report = useMutation({
    mutationFn: (selected: string | null) => fetchReport({ data: { siteUrl: selected, baseline } }),
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

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <span className="text-sm font-bold">محور المقارنة:</span>
          {BASELINE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={baseline === opt.value ? "default" : "outline"}
              onClick={() => setBaseline(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
          <span className="w-full text-xs text-muted-foreground">
            «تلقائي» يقارن بمتوسط آخر 7 فحوصات عند توفّر 3 لقطات أو أكثر، وإلا يقارن بآخر لقطة سابقة.
          </span>
        </CardContent>
      </Card>


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
                    محور المقارنة: {data.baseline.label} ({data.baseline.samples} لقطة، أحدثها{" "}
                    {formatDate(data.previous.createdAt)}) — {data.previous.indexedUrls} صفحة مفهرسة من الصفحات
                    المراقبة.
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

      <DropAlerts />

      <IndexingTrendCharts />

      <SearchConsoleExport />

      <SnapshotSchedulePanel />

      <Card className="mt-6">

        <CardHeader>
          <CardTitle className="text-base">طلب فحص URL بعد تحديث العروض</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            اختر الصفحات التي تغيّرت بعد تحديث العروض ثم أرسل طلب فحص URL إلى Search Console. تُحفظ
            النتيجة في جدول السجل بالأسفل.
          </p>
          <div className="flex flex-wrap gap-2">
            {MONITORED_PATHS.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={selectedPaths.includes(p) ? "default" : "outline"}
                onClick={() => togglePath(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => inspection.mutate(selectedPaths)}
              disabled={inspection.isPending || selectedPaths.length === 0}
            >
              <Search className={`ml-2 h-4 w-4 ${inspection.isPending ? "animate-pulse" : ""}`} />
              {inspection.isPending ? "جارٍ إرسال الطلب…" : `فحص ${selectedPaths.length} صفحة`}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPaths([])}>
              مسح الاختيار
            </Button>
          </div>

          {inspection.isPending && <Skeleton className="h-16 w-full rounded-2xl" />}

          {inspection.data?.status === "error" && (
            <div className="flex items-center gap-2 rounded-2xl border border-destructive/40 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {ERROR_LABEL[inspection.data.error] ?? `تعذّر تنفيذ الفحص (${inspection.data.error}).`}
            </div>
          )}

          {inspection.data?.status === "selection_required" && (
            <div className="flex flex-wrap gap-2">
              {inspection.data.candidates.map((c) => (
                <Button
                  key={c}
                  variant={siteUrl === c ? "default" : "outline"}
                  onClick={() => {
                    setSiteUrl(c);
                    inspection.mutate(selectedPaths);
                  }}
                >
                  <Globe className="ml-2 h-4 w-4" />
                  {c}
                </Button>
              ))}
            </div>
          )}

          {inspection.data?.status === "ok" && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                نتيجة الفحص: {inspection.data.totals.indexedUrls}/{inspection.data.totals.inspected} صفحة
                مفهرسة.
              </div>
              {inspection.data.inspections.map((i) => (
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
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">سجل الفحوصات السابقة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {snapshots.isLoading && <Skeleton className="h-16 w-full rounded-2xl" />}
          {!snapshots.isLoading && (snapshots.data?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">لا توجد فحوصات محفوظة بعد.</p>
          )}
          {(snapshots.data ?? []).map((s) => {
            const isUrlInspection =
              (s.details as { mode?: string } | null)?.mode === "url_inspection";
            return (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3 text-xs"
              >
                <span className="flex items-center gap-2">
                  <Badge variant={isUrlInspection ? "default" : "secondary"}>
                    {isUrlInspection ? "فحص URL" : "فحص شامل"}
                  </Badge>
                  {formatDate(s.created_at)}
                </span>
                <span className="text-muted-foreground">
                  {isUrlInspection ? (
                    <>
                      مفهرسة: {s.indexed_urls}/{s.inspected_urls}
                    </>
                  ) : (
                    <>
                      مفهرسة: {s.indexed_urls}/{s.inspected_urls} — خريطة: {s.indexed}/{s.submitted} —
                      أخطاء: {s.sitemap_errors}
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

    </main>
  );
}
