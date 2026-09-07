import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BellRing, Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDealAlertSettings,
  runDealAlertsNow,
  updateDealAlertSettings,
} from "@/lib/deal-alerts.functions";

export const DEAL_ALERT_SETTINGS_KEY = ["deal-alert-settings"] as const;

/** كل 5 دقائق: نفس دورة سجل المزامنة */
const AUTO_MS = 5 * 60 * 1000;

export function DealAlertsPanel() {
  const load = useServerFn(getDealAlertSettings);
  const save = useServerFn(updateDealAlertSettings);
  const runNow = useServerFn(runDealAlertsNow);
  const queryClient = useQueryClient();

  const [enabled, setEnabled] = useState(true);
  const [leadHours, setLeadHours] = useState(24);
  const [couponsEnabled, setCouponsEnabled] = useState(true);
  const [couponHours, setCouponHours] = useState(24);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: DEAL_ALERT_SETTINGS_KEY,
    queryFn: () => load(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setLeadHours(data.lead_hours);
    setCouponsEnabled(data.coupons_enabled);
    setCouponHours(data.coupon_window_hours);
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await save({
        data: {
          enabled,
          lead_hours: leadHours,
          coupons_enabled: couponsEnabled,
          coupon_window_hours: couponHours,
        },
      });
      await queryClient.invalidateQueries({ queryKey: DEAL_ALERT_SETTINGS_KEY });
      toast.success(`تم الحفظ — التنبيه قبل ${leadHours} ساعة من انتهاء العرض`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  }

  /** تشغيل جولة تنبيهات (يدوي أو تلقائي مع دورة سجل المزامنة) */
  async function sweep(auto = false) {
    setRunning(true);
    try {
      const res = await runNow();
      setLastRun(new Date().toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" }));
      if (!auto) {
        if (res.reason === "no_subscriptions") {
          toast.message("لا يوجد مشتركون في الإشعارات بعد — فعّل «إشعارات العروض» من الإعدادات");
        } else if (res.reason === "alerts_disabled") {
          toast.message("التنبيهات موقوفة من هذه اللوحة");
        } else if (res.sent === 0) {
          toast.message("لا توجد عروض أو كوبونات تستحق التنبيه الآن");
        } else {
          toast.success(`أُرسل ${res.sent} تنبيهًا (${res.expiringNotified} عرض • ${res.couponsNotified} كوبون)`);
        }
      }
    } catch (error) {
      if (!auto) toast.error(error instanceof Error ? error.message : "تعذّر تشغيل التنبيهات");
    } finally {
      setRunning(false);
    }
  }

  // ربط تلقائي مع دورة سجل المزامنة
  const sweepRef = useRef(sweep);
  sweepRef.current = sweep;
  useEffect(() => {
    void sweepRef.current(true);
    const id = setInterval(() => void sweepRef.current(true), AUTO_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="mb-5" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="size-4 text-primary" aria-hidden="true" />
          لوحة تنبيهات العروض
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          حدّد وقت التنبيه قبل انتهاء العرض. التنبيهات تنطلق تلقائيًا مع كل دورة مزامنة (كل 5 دقائق)
          {lastRun ? ` • آخر تشغيل: ${lastRun}` : ""}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-xl" />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <Label htmlFor="alerts-enabled" className="text-sm font-medium">
                تفعيل تنبيهات انتهاء العروض
              </Label>
              <Switch id="alerts-enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lead-hours" className="text-sm">
                  التنبيه قبل انتهاء العرض بـ (ساعة)
                </Label>
                <Input
                  id="lead-hours"
                  type="number"
                  min={1}
                  max={168}
                  value={leadHours}
                  onChange={(e) => setLeadHours(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-hours" className="text-sm">
                  اعتبار الكوبون جديدًا خلال (ساعة)
                </Label>
                <Input
                  id="coupon-hours"
                  type="number"
                  min={1}
                  max={168}
                  value={couponHours}
                  onChange={(e) => setCouponHours(Number(e.target.value))}
                  disabled={!couponsEnabled}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <Label htmlFor="coupons-enabled" className="text-sm font-medium">
                تنبيه عند إضافة كوبون جديد
              </Label>
              <Switch id="coupons-enabled" checked={couponsEnabled} onCheckedChange={setCouponsEnabled} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? (
                  <Loader2 className="ms-2 size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="ms-2 size-4" aria-hidden="true" />
                )}
                حفظ الإعدادات
              </Button>
              <Button variant="outline" onClick={() => void sweep()} disabled={running}>
                {running ? (
                  <Loader2 className="ms-2 size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="ms-2 size-4" aria-hidden="true" />
                )}
                تشغيل التنبيهات الآن
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
