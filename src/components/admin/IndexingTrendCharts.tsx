import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { getIndexingTrend } from "@/lib/search-console.functions";

const config = {
  indexedUrls: { label: "صفحات مفهرسة", color: "hsl(var(--primary))" },
  inspected: { label: "صفحات مفحوصة", color: "hsl(var(--muted-foreground))" },
  crawled: { label: "روابط مفهرسة (الخريطة)", color: "hsl(var(--primary))" },
  submitted: { label: "روابط مُرسلة", color: "hsl(var(--muted-foreground))" },
} as const;

function formatDay(value: string) {
  return new Date(value).toLocaleDateString("ar-SA", { day: "numeric", month: "short" });
}

export function IndexingTrendCharts() {
  const fetchTrend = useServerFn(getIndexingTrend);
  const trend = useQuery({ queryKey: ["sc-trend"], queryFn: () => fetchTrend({ data: undefined }) });
  const points = trend.data ?? [];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          اتجاه الفهرسة وزحف Google — آخر 30 يوماً
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {trend.isLoading && <Skeleton className="h-64 w-full rounded-2xl" />}
        {!trend.isLoading && points.length === 0 && (
          <p className="text-sm text-muted-foreground">لا توجد لقطات محفوظة خلال آخر 30 يوماً بعد.</p>
        )}
        {points.length > 0 && (
          <>
            <div>
              <div className="mb-2 text-xs text-muted-foreground">عدد الصفحات المفهرسة مقابل المفحوصة</div>
              <ChartContainer config={config} className="h-56 w-full">
                <ResponsiveContainer>
                  <LineChart data={points} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tickFormatter={formatDay} tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} fontSize={11} />
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => formatDay(String(l))} />} />
                    <Line type="monotone" dataKey="indexedUrls" stroke="var(--color-indexedUrls)" strokeWidth={2} dot={false} />
                    <Line
                      type="monotone"
                      dataKey="inspected"
                      stroke="var(--color-inspected)"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div>
              <div className="mb-2 text-xs text-muted-foreground">زحف Google عبر خريطة الموقع (مُرسلة مقابل مفهرسة)</div>
              <ChartContainer config={config} className="h-56 w-full">
                <ResponsiveContainer>
                  <AreaChart data={points} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tickFormatter={formatDay} tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} fontSize={11} />
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => formatDay(String(l))} />} />
                    <Area
                      type="monotone"
                      dataKey="submitted"
                      stroke="var(--color-submitted)"
                      fill="var(--color-submitted)"
                      fillOpacity={0.12}
                    />
                    <Area
                      type="monotone"
                      dataKey="crawled"
                      stroke="var(--color-crawled)"
                      fill="var(--color-crawled)"
                      fillOpacity={0.25}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
