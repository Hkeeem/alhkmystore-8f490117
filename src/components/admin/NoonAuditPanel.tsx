import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { History, RefreshCw, User, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listNoonAuditLog } from "@/lib/noon-audit.functions";

const TONE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  noon_link_campaign: "default",
  noon_publisher_saved: "default",
  noon_verify_publisher: "secondary",
  noon_unlink_campaign: "destructive",
  noon_publisher_removed: "destructive",
};

export function NoonAuditPanel() {
  const fetchLog = useServerFn(listNoonAuditLog);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["noon-audit-log"],
    queryFn: () => fetchLog({ data: { limit: 25 } }),
    retry: false,
  });

  return (
    <Card className="hover-lift">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="size-5" /> سجل تدقيق ربط noon
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="press-ripple"
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          كل عملية ربط أو فك ربط للحملة، وكل تغيير على Publisher ID، تُسجَّل هنا بالوقت والمستخدم
          وتفاصيل التغيير (المعرّفات مقنّعة دائمًا).
        </p>

        {isLoading && <p className="text-sm text-muted-foreground">جارٍ تحميل السجل…</p>}
        {isError && <p className="text-sm text-destructive">سجل التدقيق متاح للمشرفين فقط.</p>}
        {data?.length === 0 && (
          <p className="text-sm text-muted-foreground">لا توجد عمليات مسجّلة بعد.</p>
        )}

        <ol className="space-y-2">
          {(data ?? []).map((e) => (
            <li key={e.id} className="rounded-xl border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant={TONE[e.action] ?? "secondary"}>{e.actionLabel}</Badge>
                <span className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="size-3" /> {e.actorName}
                  </span>
                  <span className="flex items-center gap-1" dir="ltr">
                    <Clock className="size-3" />
                    {new Date(e.at).toLocaleString("ar-SA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </span>
              </div>
              {e.details.length > 0 && (
                <dl className="mt-2 grid gap-1 sm:grid-cols-2">
                  {e.details.map((d) => (
                    <div key={d.label} className="flex items-center gap-1 text-xs">
                      <dt className="text-muted-foreground">{d.label}:</dt>
                      <dd className="font-medium truncate" dir="auto">
                        {d.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
