import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, KeyRound, Link2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getNoonCampaignStatus, verifyNoonPublisherId, runExternalSyncNow } from "@/lib/affiliate-setup.functions";
import { saveIntegrationKeyValue } from "@/lib/integration-keys.functions";
import { fetchLiveCoupons } from "@/lib/coupons-api";
import { REAL_DEALS_KEY } from "@/hooks/use-real-deals";

/** لوحة إعدادات نون داخل صفحة سجل المزامنة: معرّف الناشر، حالة الحملة، وتشغيل المزامنة */
export function NoonSyncSettingsPanel() {
  const queryClient = useQueryClient();
  const fetchStatus = useServerFn(getNoonCampaignStatus);
  const verify = useServerFn(verifyNoonPublisherId);
  const saveKey = useServerFn(saveIntegrationKeyValue);
  const runSync = useServerFn(runExternalSyncNow);
  const [publisherId, setPublisherId] = useState("");

  const statusQuery = useQuery({ queryKey: ["noon-campaign-status"], queryFn: () => fetchStatus() });
  const status = statusQuery.data;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const id = publisherId.trim();
      const check = await verify({ data: { publisherId: id } });
      if (!check.ok) throw new Error(check.reason);
      const res = await saveKey({ data: { name: "NOON_AFFILIATE_ID", value: id } });
      if (!res.ok) throw new Error(res.reason ?? "تعذّر الحفظ");
      return check;
    },
    onSuccess: (check) => {
      toast.success(`تم حفظ معرّف الناشر — الحملة: ${check.campaignName}`);
      setPublisherId("");
      void queryClient.invalidateQueries({ queryKey: ["noon-campaign-status"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر حفظ المعرّف"),
  });

  const syncMutation = useMutation({
    mutationFn: () => runSync({ data: { source: "noon" } }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`اكتملت مزامنة نون: ${res.sources.noon} عرضًا`);
      } else {
        toast.error("فشلت مزامنة نون — راجع السجل أدناه");
      }
      void queryClient.invalidateQueries({ queryKey: ["sync-events"] });
      void queryClient.invalidateQueries({ queryKey: ["noon-campaign-status"] });
      // دمج عروض نون مع عروض التجّار فورًا (تنعكس في كل العروض والخريطة)
      void queryClient.invalidateQueries({ queryKey: REAL_DEALS_KEY });
    },
    onError: () => toast.error("تعذّر تشغيل المزامنة"),
  });

  const couponsMutation = useMutation({
    mutationFn: async () => {
      // نحاول المزامنة أولًا، ولو تعطّلت نكمل بجلب الكوبونات المحفوظة يدويًا
      try {
        if (status?.configured) await runSync({ data: { source: "noon" } });
      } catch {
        /* المزامنة قد تكون متوقفة مؤقتًا — نكمل الجلب اليدوي */
      }
      const coupons = await fetchLiveCoupons();
      return coupons.filter((c) => (c.storeName ?? "").includes("نون") || c.storeId === "noon").length;
    },
    onSuccess: (count) => {
      void queryClient.invalidateQueries({ queryKey: ["live-coupons"] });
      void queryClient.invalidateQueries({ queryKey: ["sync-events"] });
      void queryClient.invalidateQueries({ queryKey: REAL_DEALS_KEY });
      toast.success(count > 0 ? `تم جلب ${count} كوبون من نون` : "لا توجد كوبونات نون فعّالة حاليًا");
    },
    onError: () => toast.error("تعذّر جلب كوبونات نون"),
  });

  return (
    <Card className="mb-6" dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
          إعدادات نون — واجهة الأفلييت الرسمية
          {status?.linked ? (
            <Badge variant="default" className="gap-1"><BadgeCheck className="size-3" /> مربوطة فعليًا</Badge>
          ) : status?.configured ? (
            <Badge variant="secondary">المعرّف محفوظ</Badge>
          ) : (
            <Badge variant="outline" className="gap-1"><XCircle className="size-3" /> غير مهيّأة</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusQuery.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-3">
                <p className="text-xl font-bold">{status?.stats.liveDeals ?? 0}</p>
                <p className="text-xs text-muted-foreground">عروض نون النشطة</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xl font-bold">{status?.stats.clicks ?? 0}</p>
                <p className="text-xs text-muted-foreground">نقرات عبر روابطك</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xl font-bold">{status?.stats.conversions ?? 0}</p>
                <p className="text-xs text-muted-foreground">تحويلات مسجّلة</p>
              </div>
            </div>

            {status?.maskedPublisherId && (
              <p className="text-sm text-muted-foreground">
                المعرّف الحالي: <span className="font-mono" dir="ltr">{status.maskedPublisherId}</span>
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <KeyRound className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={publisherId}
                  onChange={(e) => setPublisherId(e.target.value)}
                  placeholder="معرّف الناشر من برنامج نون للأفلييت (Admitad / Boostiny / تسجيل مباشر)"
                  className="ps-9"
                  dir="ltr"
                />
              </div>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={publisherId.trim().length < 3 || saveMutation.isPending}
              >
                <Link2 className="size-4" aria-hidden="true" />
                {saveMutation.isPending ? "جارٍ الحفظ…" : "حفظ وربط الحملة"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending || !status?.configured}
              >
                <RefreshCw className={`size-4 ${syncMutation.isPending ? "animate-spin" : ""}`} aria-hidden="true" />
                {syncMutation.isPending ? "جارٍ المزامنة…" : "مزامنة عروض نون الآن"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => couponsMutation.mutate()}
                disabled={couponsMutation.isPending}
              >
                <RefreshCw className={`size-4 ${couponsMutation.isPending ? "animate-spin" : ""}`} aria-hidden="true" />
                {couponsMutation.isPending ? "جارٍ الجلب…" : "جلب كوبونات نون يدويًا"}
              </Button>
              {!status?.configured && (
                <p className="text-xs text-muted-foreground">احفظ معرّف الناشر أولًا حتى تعمل المزامنة بالربط الرسمي.</p>
              )}
            </div>

            {status?.sampleDeepLink && (
              <p className="break-all rounded-md bg-muted p-2 text-xs text-muted-foreground" dir="ltr">
                {status.sampleDeepLink}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
