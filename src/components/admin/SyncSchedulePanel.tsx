import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarClock, Check, RefreshCw, PauseCircle, PlayCircle, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { getSyncSchedule, runExternalSyncNow, setSyncSchedule } from "@/lib/affiliate-setup.functions";


/** خيارات فترات جاهزة (تعبير cron) */
const PRESETS: Array<{ label: string; cron: string }> = [
  { label: "كل ساعة", cron: "0 * * * *" },
  { label: "كل ٣ ساعات", cron: "0 */3 * * *" },
  { label: "كل ٦ ساعات", cron: "0 */6 * * *" },
  { label: "كل ١٢ ساعة", cron: "0 */12 * * *" },
  { label: "يوميًا ٣ فجرًا", cron: "0 3 * * *" },
];

function describeCron(cron: string) {
  const found = PRESETS.find((p) => p.cron === cron);
  return found ? found.label : `مخصص (${cron})`;
}

type TestSource = "amazon" | "noon";

export function SyncSchedulePanel() {
  const fetchSchedule = useServerFn(getSyncSchedule);
  const saveSchedule = useServerFn(setSyncSchedule);
  const runNow = useServerFn(runExternalSyncNow);
  const [testing, setTesting] = useState<TestSource | null>(null);
  const [lastTest, setLastTest] = useState<{ source: TestSource; ok: boolean; at: string; detail: string } | null>(null);

  async function runTest(source: TestSource) {
    setTesting(source);
    const label = source === "amazon" ? "أمازون" : "نون";
    try {
      const res = (await runNow({ data: { source } })) as
        | { success: true; inserted?: number; updated?: number; total?: number }
        | { success: false; error?: string };
      const ok = Boolean(res?.success);
      const detail = ok
        ? `مضاف ${(res as { inserted?: number }).inserted ?? 0} · محدّث ${(res as { updated?: number }).updated ?? 0}`
        : "فشل الاختبار";
      setLastTest({ source, ok, at: new Date().toISOString(), detail });
      if (ok) toast.success(`اختبار مزامنة ${label} نجح — ${detail}`);
      else toast.error(`اختبار مزامنة ${label} فشل`);
    } catch {
      setLastTest({ source, ok: false, at: new Date().toISOString(), detail: "غير مصرّح أو خطأ في الخادم" });
      toast.error("تعذّر تشغيل الاختبار — للمشرفين فقط");
    } finally {
      setTesting(null);
    }
  }


  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["sync-schedule"],
    queryFn: () => fetchSchedule({}),
  });

  const current = data?.ok ? data.schedule : null;
  const [cron, setCron] = useState("0 */6 * * *");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (current?.schedule) setCron(current.schedule);
    if (typeof current?.active === "boolean") setActive(current.active);
  }, [current?.schedule, current?.active]);

  const save = useMutation({
    mutationFn: (vars: { schedule: string; active: boolean }) => saveSchedule({ data: vars }),
    onSuccess: (res) => {
      if (!res?.ok) { toast.error(res?.reason ?? "تعذّر الحفظ"); return; }
      toast.success(`تم ضبط المزامنة: ${describeCron(res.schedule)}${res.active ? "" : " (موقوفة)"}`);
      refetch();
    },
    onError: () => toast.error("غير مصرّح — هذه الخطوة للمشرفين فقط"),
  });

  const dirty = current ? cron !== current.schedule || active !== current.active : false;

  return (
    <Card className="hover-lift">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="size-5" /> المزامنة التلقائية المجدولة
        </CardTitle>
        <div className="flex items-center gap-2">
          {isLoading ? null : current?.exists ? (
            current.active ? (
              <Badge className="gap-1"><PlayCircle className="size-3" /> تعمل</Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground"><PauseCircle className="size-3" /> موقوفة</Badge>
            )
          ) : (
            <Badge variant="outline" className="text-muted-foreground">غير مهيّأة</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="press-ripple">
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          تسحب المهمة عروض أمازون ونون وأسعارها وتوفّرها وتحدّثها داخل قاعدة البيانات تلقائيًا حسب الفترة المختارة.
        </p>

        {current?.exists && (
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border px-2 py-3">
              <p className="text-sm font-bold text-primary">{describeCron(current.schedule ?? "")}</p>
              <p className="text-[11px] text-muted-foreground">الفترة الحالية</p>
            </div>
            <div className="rounded-lg border px-2 py-3">
              <p className="text-sm font-bold text-primary">
                {current.lastRunAt ? new Date(current.lastRunAt).toLocaleString("ar-SA") : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                آخر تشغيل {current.lastStatus ? `· ${current.lastStatus}` : ""}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold">اختر الفترة</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.cron}
                type="button"
                onClick={() => setCron(p.cron)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${cron === p.cron ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/50"}`}
              >
                {p.label}
                {cron === p.cron && <Check className="inline size-3 ms-1" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">تعبير cron مخصص</span>
            <input
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              dir="ltr"
              placeholder="0 */6 * * *"
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-semibold">تفعيل المزامنة التلقائية</p>
            <p className="text-[11px] text-muted-foreground">عند الإيقاف تبقى الإعدادات محفوظة دون تشغيل.</p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} aria-label="تفعيل المزامنة التلقائية" />
        </div>

        <Button
          className="w-full press-ripple"
          disabled={save.isPending || !dirty || !current?.exists}
          onClick={() => save.mutate({ schedule: cron.trim(), active })}
        >
          {save.isPending ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}
          حفظ الجدولة
        </Button>
      </CardContent>
    </Card>
  );
}
