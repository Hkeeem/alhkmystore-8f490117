import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MousePointerClick, MapPin, ShoppingBag, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDealClickStats } from "@/lib/deal-tracking.functions";

export const Route = createFileRoute("/_authenticated/deal-reports")({
  component: DealReportsPage,
  head: () => ({
    meta: [
      { title: "تقارير العروض | حكيم AI" },
      {
        name: "description",
        content: "تقارير زيارات العروض ونسبة التحويل إلى طلبات، مع تصفية حسب المدينة.",
      },
      { property: "og:title", content: "تقارير العروض | حكيم AI" },
      { property: "og:description", content: "من يضغط على العروض، من أي مدينة، وكم منها يتحول لطلب." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function DealReportsPage() {
  const fetchStats = useServerFn(getDealClickStats);
  const [days, setDays] = useState(7);
  const [city, setCity] = useState<string>("الكل");

  const { data, isPending, isError } = useQuery({
    queryKey: ["deal-click-stats", days],
    queryFn: () => fetchStats({ data: { days } }),
    refetchInterval: 60_000,
  });

  const cities = useMemo(() => ["الكل", ...(data?.cities ?? []).map((c) => c.city)], [data]);
  const deals = useMemo(
    () => (data?.deals ?? []).filter((d) => city === "الكل" || d.city === city),
    [data, city],
  );

  const rate = (clicks: number, conv: number) =>
    clicks > 0 ? `${Math.round((conv / clicks) * 1000) / 10}%` : "—";

  return (
    <main className="max-w-5xl mx-auto px-4 pt-5 pb-14 space-y-4">
      <header className="space-y-1">
        <h1 className="font-display font-black text-xl sm:text-2xl">تقارير العروض</h1>
        <p className="text-sm text-muted-foreground">
          عدد الزيارات لكل عرض من الخريطة والقائمة، ونسبة تحوّلها إلى طلبات.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-bold border ${
              days === d ? "bg-primary text-primary-foreground border-primary" : "border-border"
            }`}
          >
            آخر {d} يوم
          </button>
        ))}
      </div>

      {isError && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">
            تعذّر تحميل التقارير. تأكد أن حسابك يملك صلاحية إدارية.
          </CardContent>
        </Card>
      )}

      {isPending ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={MousePointerClick} label="إجمالي الزيارات" value={data.totalClicks} />
            <StatCard icon={ShoppingBag} label="عروض تمت زيارتها" value={data.uniqueDeals} />
            <StatCard icon={MapPin} label="زوار مختلفون" value={data.sessions} />
            <StatCard icon={Percent} label="نسبة التحويل" value={`${data.conversionRate}%`} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">حسب المدينة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    className={`px-3 py-1.5 rounded-full text-[13px] font-bold border ${
                      city === c ? "bg-primary text-primary-foreground border-primary" : "border-border"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {data.cities.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد زيارات مسجّلة بعد في هذه الفترة.</p>
              ) : (
                <ul className="text-sm divide-y divide-border/60">
                  {data.cities.map((c) => (
                    <li key={c.city} className="flex items-center justify-between py-2">
                      <span className="font-bold">{c.city}</span>
                      <span className="text-muted-foreground">
                        {c.clicks} زيارة · {c.deals} عرض · تحويل {rate(c.clicks, c.conversions)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                العروض الأكثر زيارة {city !== "الكل" ? `— ${city}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد بيانات لهذه المدينة بعد.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-muted-foreground text-[12px]">
                      <tr className="text-right">
                        <th className="py-2 font-bold">العرض</th>
                        <th className="py-2 font-bold">المتجر</th>
                        <th className="py-2 font-bold">الزيارات</th>
                        <th className="py-2 font-bold">خريطة</th>
                        <th className="py-2 font-bold">قائمة</th>
                        <th className="py-2 font-bold">طلبات</th>
                        <th className="py-2 font-bold">التحويل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {deals.map((d) => (
                        <tr key={d.dealId} className="text-right">
                          <td className="py-2 max-w-[220px] truncate font-bold">{d.title}</td>
                          <td className="py-2 text-muted-foreground">{d.storeName}</td>
                          <td className="py-2">{d.clicks}</td>
                          <td className="py-2">{d.mapClicks}</td>
                          <td className="py-2">{d.listClicks}</td>
                          <td className="py-2">{d.conversions}</td>
                          <td className="py-2">{rate(d.clicks, d.conversions)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-[12px]">
          <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
          {label}
        </div>
        <p className="mt-1 text-xl font-black">{value}</p>
      </CardContent>
    </Card>
  );
}
