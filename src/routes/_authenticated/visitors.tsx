import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, MapPin, Route as RouteIcon, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getVisitorStats } from "@/lib/visits.functions";
import { CITIES } from "@/data/store-branches";

export const Route = createFileRoute("/_authenticated/visitors")({
  component: VisitorsPage,
  head: () => ({
    meta: [
      { title: "تعداد الزوار ومساراتهم | حكيم AI" },
      {
        name: "description",
        content: "لوحة إدارية تعرض عدد الزوار، المدن التي يزورون منها، ومسار تنقلهم بين صفحات العروض.",
      },
      { property: "og:title", content: "تعداد الزوار ومساراتهم | حكيم AI" },
      { property: "og:description", content: "تابع من يزور العروض ومن أي مدينة وأي الصفحات يتصفحها." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function VisitorsPage() {
  const fetchStats = useServerFn(getVisitorStats);
  const { data, isPending, isError } = useQuery({
    queryKey: ["visitor-stats", 7],
    queryFn: () => fetchStats({ data: { days: 7 } }),
    refetchInterval: 60_000,
  });

  const cityPoints = useMemo(() => {
    if (!data) return [];
    return data.byCity
      .map((c) => {
        const match = CITIES.find((x) => c.city.includes(x.name) || x.name.includes(c.city));
        return match ? { ...c, lat: match.lat, lng: match.lng } : null;
      })
      .filter(Boolean) as { city: string; count: number; lat: number; lng: number }[];
  }, [data]);

  const max = Math.max(1, ...cityPoints.map((p) => p.count));

  return (
    <main className="max-w-5xl mx-auto px-4 pt-5 pb-14 space-y-4">
      <header>
        <h1 className="font-display font-black text-xl sm:text-2xl">تعداد الزوار ومساراتهم</h1>
        <p className="text-sm text-muted-foreground mt-1">آخر 7 أيام — من يزور العروض ومن أي مدينة.</p>
      </header>

      {isError && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
          تعذّر تحميل بيانات الزوار. تأكد أن حسابك لديه صلاحية إدارية.
        </p>
      )}

      {isPending ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl col-span-2" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" /> مشاهدات الصفحات
                </p>
                <p className="font-display font-black text-2xl mt-1">{data.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" /> زوّار (جلسات)
                </p>
                <p className="font-display font-black text-2xl mt-1">{data.sessions}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" /> الزوار على الخريطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cityPoints.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد مدن معروفة بعد للزوار الحاليين.</p>
              ) : (
                <div className="relative w-full rounded-2xl border border-border/60 bg-muted/40 overflow-hidden aspect-[4/3] sm:aspect-[16/9]">
                  {cityPoints.map((p) => {
                    // تحويل تقريبي لإحداثيات المملكة إلى نسبة داخل الإطار
                    const left = ((p.lng - 34) / (56 - 34)) * 100;
                    const top = ((32 - p.lat) / (32 - 16)) * 100;
                    const size = 16 + (p.count / max) * 26;
                    return (
                      <div
                        key={p.city}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/70 border border-primary flex items-center justify-center text-[10px] font-black text-primary-foreground"
                        style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
                        title={`${p.city}: ${p.count}`}
                      >
                        {p.count}
                      </div>
                    );
                  })}
                  <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
                    خريطة تقريبية للمملكة
                  </span>
                </div>
              )}
              <ul className="mt-3 flex flex-wrap gap-2">
                {data.byCity.slice(0, 10).map((c) => (
                  <li key={c.city} className="px-3 py-1.5 rounded-full bg-secondary text-xs font-bold">
                    {c.city} · {c.count}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">أكثر الصفحات زيارة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.byPath.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد زيارات مسجّلة بعد.</p>
              ) : (
                data.byPath.map((p) => (
                  <div key={p.path} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate" dir="ltr">{p.path}</span>
                    <span className="font-black text-primary shrink-0">{p.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <RouteIcon className="w-4 h-4" /> مسارات الزوار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.journeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد مسارات بعد.</p>
              ) : (
                data.journeys.map((j) => (
                  <div key={j.session} className="rounded-2xl border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground mb-1.5">
                      زائر {j.session.slice(0, 6)} · {j.city ?? "مدينة غير محددة"}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs" dir="ltr">
                      {j.steps.map((s, i) => (
                        <span key={`${s.at}-${i}`} className="px-2 py-1 rounded-lg bg-secondary font-medium">
                          {s.path}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </main>
  );
}
