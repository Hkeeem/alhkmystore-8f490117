import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listSyncEvents } from "@/lib/affiliate-setup.functions";

/** يطابق MAX_SYNC_ATTEMPTS في محرك المزامنة */
const MAX_SYNC_ATTEMPTS = 3;

export const Route = createFileRoute("/_authenticated/sync-log")({
  component: SyncLogPage,
  head: () => ({
    meta: [
      { title: "سجل عمليات المزامنة | حكيم AI" },
      {
        name: "description",
        content:
          "تابع سجل مزامنة عروض Amazon وnoon داخل حكيم AI: وقت كل عملية وحالتها وسبب الفشل إن وُجد.",
      },
      { property: "og:title", content: "سجل عمليات المزامنة | حكيم AI" },
      {
        property: "og:description",
        content: "وقت وحالة وسبب فشل كل عملية مزامنة لعروض Amazon وnoon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const SOURCES = [
  { value: "all", label: "كل المصادر" },
  { value: "amazon", label: "Amazon" },
  { value: "noon", label: "noon" },
];

const STATUSES = [
  { value: "all", label: "كل الحالات" },
  { value: "success", label: "ناجحة" },
  { value: "failure", label: "فاشلة" },
];

const REASONS: Record<string, string> = {
  missing_keys: "مفاتيح الربط غير مكتملة",
  auth_error: "المفاتيح مرفوضة أو التوقيع غير صحيح",
  partner_tag_invalid: "Partner Tag غير صالح",
  throttled: "تجاوز حد الطلبات — أُعيدت المحاولة تلقائيًا",
  network_error: "انقطاع في الاتصال — أُعيدت المحاولة تلقائيًا",
  http_error: "استجابة غير صالحة من المزوّد",
  upsert_failed: "تعذّر حفظ العروض في قاعدة البيانات",
  empty_result: "لم تُرجع الدورة أي عروض",
};
function formatDate(value: string) {
  return new Date(value).toLocaleString("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SyncLogPage() {
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const fetchEvents = useServerFn(listSyncEvents);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["sync-events", source, status],
    queryFn: () => fetchEvents({ data: { source, status, limit: 150 } }),
  });

  const events = data?.ok ? data.events : [];
  const failures = events.filter((e) => e.status === "failure").length;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <History className="size-6 text-primary" aria-hidden="true" />
            سجل عمليات المزامنة
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            كل عملية سحب عروض من Amazon وnoon مع وقتها وحالتها وسبب الفشل إن حصل. عند انقطاع الاتصال أو تجاوز حد الطلبات تُعاد المحاولة تلقائيًا حتى {MAX_SYNC_ATTEMPTS} محاولات بتأخير تصاعدي قبل تسجيل الفشل.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="تحديث سجل المزامنة"
        >
          <RefreshCw className={`ms-2 size-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
          تحديث
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية حسب المصدر">
          {SOURCES.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={source === s.value ? "default" : "outline"}
              onClick={() => setSource(s.value)}
              aria-pressed={source === s.value}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية حسب الحالة">
          {STATUSES.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={status === s.value ? "default" : "outline"}
              onClick={() => setStatus(s.value)}
              aria-pressed={status === s.value}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : data && !data.ok ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">{data.reason}</CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            لا توجد عمليات مزامنة مسجّلة بعد ضمن هذه التصفية.
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {events.length} عملية معروضة — منها {failures} فاشلة.
          </p>
          <ul className="space-y-3">
            {events.map((e) => {
              const failed = e.status === "failure";
              return (
                <li key={e.id}>
                  <Card className={failed ? "border-destructive/40" : undefined}>
                    <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {failed ? (
                          <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                        )}
                        {e.source === "amazon" ? "Amazon" : e.source === "noon" ? "noon" : e.source}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={failed ? "destructive" : "secondary"}>
                          {failed ? "فشلت" : "نجحت"}
                        </Badge>
                        <time
                          dateTime={e.created_at}
                          className="text-xs text-muted-foreground"
                        >
                          {formatDate(e.created_at)}
                        </time>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 pt-0 text-sm">
                      {e.keyword ? (
                        <p className="text-muted-foreground">الكلمة المفتاحية: {e.keyword}</p>
                      ) : null}
                      {failed ? (
                        <>
                          <p className="font-medium">
                            السبب: {(e.code && REASONS[e.code]) || e.code || "سبب غير محدّد"}
                          </p>
                          {e.message ? (
                            <p className="break-words text-muted-foreground">{e.message}</p>
                          ) : null}
                        </>
                      ) : e.message ? (
                        <p className="text-muted-foreground">{e.message}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
