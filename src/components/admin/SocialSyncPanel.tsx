import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Megaphone, RefreshCw, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  listSocialAccounts,
  addSocialAccount,
  toggleSocialAccount,
  deleteSocialAccount,
  runSocialSyncNow,
} from "@/lib/social-offers.functions";

type Account = {
  id: string;
  platform: string;
  handle: string;
  feed_url: string | null;
  city: string | null;
  active: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_count: number;
};

export function SocialSyncPanel() {
  const qc = useQueryClient();
  const list = useServerFn(listSocialAccounts);
  const add = useServerFn(addSocialAccount);
  const toggle = useServerFn(toggleSocialAccount);
  const remove = useServerFn(deleteSocialAccount);
  const runSync = useServerFn(runSocialSyncNow);

  const [platform, setPlatform] = useState("");
  const [handle, setHandle] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [city, setCity] = useState("");

  const accounts = useQuery({
    queryKey: ["social-accounts"],
    queryFn: () => list() as Promise<Account[]>,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["social-accounts"] });
    void qc.invalidateQueries({ queryKey: ["social-offers"], refetchType: "all" });
  };

  const addMutation = useMutation({
    mutationFn: () => add({ data: { platform, handle, feed_url: feedUrl || null, city: city || null } }),
    onSuccess: () => {
      toast.success("تمت إضافة الحساب");
      setPlatform("");
      setHandle("");
      setFeedUrl("");
      setCity("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const syncMutation = useMutation({
    mutationFn: () => runSync({ data: {} }),
    onSuccess: (result: { accounts: number; upserted: number; errors: Array<{ message: string }> }) => {
      if (result.upserted > 0) toast.success(`تم جلب ${result.upserted} عرضًا من ${result.accounts} حساب`);
      else if (result.errors.length > 0) toast.error(result.errors[0]!.message);
      else toast.info("لا توجد حسابات مفعّلة للمزامنة");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            مزامنة عروض السوشال ميديا
          </span>
          <Button size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            <RefreshCw className={`w-4 h-4 ml-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            مزامنة الآن
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          أضف حساباتك الشخصية مع رابط تغذية عام (RSS/Atom/JSON) لمنشوراتك. تُقرأ المنشورات تلقائيًا كل ساعة،
          ويُستخرج منها السعر والخصم وكود الكوبون وتاريخ الانتهاء، ثم تظهر على الخريطة وفي صفحة عروض السوشال.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="المنصة (instagram / tiktok / telegram)" value={platform} onChange={(e) => setPlatform(e.target.value)} />
          <Input placeholder="اسم الحساب @" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <Input className="col-span-2" placeholder="رابط التغذية العام (اختياري)" value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} />
          <Input placeholder="المدينة (لعرضه على الخريطة)" value={city} onChange={(e) => setCity(e.target.value)} />
          <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !platform || !handle}>
            <Plus className="w-4 h-4 ml-1" />
            إضافة حساب
          </Button>
        </div>

        {accounts.isLoading && <p className="text-[12px] text-muted-foreground">جارٍ تحميل الحسابات…</p>}
        {accounts.isError && <p className="text-[12px] text-destructive">تعذّر تحميل الحسابات</p>}
        {accounts.data?.length === 0 && (
          <p className="text-[12px] text-muted-foreground">لا توجد حسابات مضافة بعد.</p>
        )}

        <ul className="space-y-2">
          {(accounts.data ?? []).map((a) => (
            <li key={a.id} className="flex items-center gap-2 border border-border/60 rounded-xl p-2">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold truncate">
                  {a.platform} · @{a.handle}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {a.last_status ? `${a.last_status} • ${a.last_count} عرض` : "لم تُشغَّل بعد"}
                  {a.city ? ` • ${a.city}` : ""}
                </p>
              </div>
              <Badge variant={a.active ? "default" : "outline"} className="text-[10px]">
                {a.active ? "مفعّل" : "موقوف"}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  toggle({ data: { id: a.id, active: !a.active } }).then(invalidate).catch((e: Error) => toast.error(e.message))
                }
              >
                {a.active ? "إيقاف" : "تفعيل"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label="حذف الحساب"
                onClick={() => remove({ data: { id: a.id } }).then(invalidate).catch((e: Error) => toast.error(e.message))}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
