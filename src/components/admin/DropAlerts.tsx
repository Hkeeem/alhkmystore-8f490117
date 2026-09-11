import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ShieldCheck, TrendingDown, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRecentDropAlerts } from "@/lib/search-console.functions";

export function DropAlerts() {
  const fetchAlerts = useServerFn(getRecentDropAlerts);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["sc-drop-alerts"],
    queryFn: () => fetchAlerts(),
    refetchInterval: 15 * 60 * 1000,
  });

  const alerts = data?.alerts ?? [];
  const hasAlerts = alerts.length > 0;

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" aria-hidden="true" />
            تنبيهات الهبوط (آخر 24–48 ساعة)
          </CardTitle>
          <CardDescription>
            مقارنة تلقائية بين متوسط آخر 24 ساعة ومتوسط الـ24 ساعة التي سبقتها للصفحات المفهرسة وزحف
            Google.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="تحديث تنبيهات الهبوط"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
          تحديث
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!data ? (
          <p className="text-sm text-muted-foreground">جارٍ تحليل اللقطات…</p>
        ) : !hasAlerts ? (
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>لا يوجد هبوط ملحوظ خلال آخر 48 ساعة. الأداء مستقر.</span>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.metric}
              className={`rounded-lg border p-4 ${
                alert.severity === "critical"
                  ? "border-destructive/50 bg-destructive/10"
                  : "border-primary/40 bg-primary/5"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle
                    className={`h-4 w-4 ${alert.severity === "critical" ? "text-destructive" : "text-primary"}`}
                    aria-hidden="true"
                  />
                  {alert.label}
                </div>
                <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                  {alert.percent}%
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                المتوسط الحالي: {alert.current} — المتوسط السابق: {alert.baseline}
              </p>
            </div>
          ))
        )}
        {data?.samples && (
          <p className="text-xs text-muted-foreground">
            عدد اللقطات المستخدمة: آخر 24 ساعة {data.samples.last24} — الـ24 ساعة السابقة{" "}
            {data.samples.prev24}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
