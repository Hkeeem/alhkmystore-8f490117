import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeftRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { listCrawlSnapshots } from "@/lib/search-console.functions";

type Snapshot = {
  id: string;
  submitted: number | null;
  indexed: number | null;
  sitemap_errors: number | null;
  inspected_urls: number | null;
  indexed_urls: number | null;
  created_at: string;
};

const chartConfig = {
  indexedUrls: { label: "صفحات مفهرسة", color: "hsl(var(--primary))" },
} as const;

function formatDate(value: string) {
  return new Date(value).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
}

function Delta({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
  const diff = current - previous;
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : null;
  const good = invert ? diff < 0 : diff > 0;
  const Icon = diff === 0 ? Minus : diff > 0 ? TrendingUp : TrendingDown;
  const tone =
    diff === 0 ? "text-muted-foreground" : good ? "text-primary" : "text-destructive";
  return (
    <span className={`flex items-center gap-1 text-xs font-bold ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {diff > 0 ? "+" : ""}
      {diff}
      {pct !== null && diff !== 0 && <span className="text-[11px] font-normal">({pct}%)</span>}
    </span>
  );
}

export function SnapshotComparison() {
  const fetchSnapshots = useServerFn(listCrawlSnapshots);
  const snapshots = useQuery({ queryKey: ["sc-snapshots"], queryFn: () => fetchSnapshots({ data: undefined }) });

  const rows = ((snapshots.data ?? []) as unknown as Snapshot[]).filter((s) => (s.inspected_urls ?? 0) > 0);
  const latest = rows[0];
  const previous = rows[1];

  const timeline = rows
    .slice(0, 12)
    .map((s) => ({
      label: new Date(s.created_at).toLocaleDateString("ar-SA", { day: "numeric", month: "short" }),
      indexedUrls: s.indexed_urls ?? 0,
    }))
    .reverse();

  const metrics = latest && previous
    ? [
        { label: "صفحات مفهرسة", current: latest.indexed_urls ?? 0, previous: previous.indexed_urls ?? 0 },
        { label: "صفحات مفحوصة", current: latest.inspected_urls ?? 0, previous: previous.inspected_urls ?? 0 },
        { label: "روابط مفهرسة (الخريطة)", current: latest.indexed ?? 0, previous: previous.indexed ?? 0 },
        { label: "روابط مُرسلة", current: latest.submitted ?? 0, previous: previous.submitted ?? 0 },
        {
          label: "أخطاء الخريطة",
          current: latest.sitemap_errors ?? 0,
          previous: previous.sitemap_errors ?? 0,
          invert: true,
        },
      ]
    : [];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
          مقارنة آخر فحص بالفحص السابق
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {snapshots.isLoading && <Skeleton className="h-40 w-full rounded-2xl" />}

        {!snapshots.isLoading && !previous && (
          <p className="text-sm text-muted-foreground">
            نحتاج فحصين محفوظين على الأقل لإظهار المقارنة. شغّل «فحص الآن» مرة أخرى لاحقاً.
          </p>
        )}

        {latest && previous && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="default">آخر فحص: {formatDate(latest.created_at)}</Badge>
              <Badge variant="secondary">الفحص السابق: {formatDate(previous.created_at)}</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-2xl border p-3">
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="font-display text-2xl font-black">{m.current}</span>
                    <Delta current={m.current} previous={m.previous} invert={m.invert} />
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">كان: {m.previous}</div>
                </div>
              ))}
            </div>

            {timeline.length > 1 && (
              <div>
                <div className="mb-2 text-xs text-muted-foreground">المخطط الزمني لعدد الصفحات المفهرسة</div>
                <ChartContainer config={chartConfig} className="h-48 w-full">
                  <ResponsiveContainer>
                    <AreaChart data={timeline} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} fontSize={11} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="indexedUrls"
                        stroke="var(--color-indexedUrls)"
                        fill="var(--color-indexedUrls)"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
