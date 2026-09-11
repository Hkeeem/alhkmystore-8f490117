import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addStoreFeed,
  deleteStoreFeed,
  listStoreFeeds,
  runStoreBotNow,
  toggleStoreFeed,
} from "@/lib/store-bot.functions";
import { REAL_DEALS_KEY } from "@/hooks/use-real-deals";

type Feed = {
  id: string;
  store_name: string;
  feed_url: string;
  category: string;
  active: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_count: number;
};

export function StoreBotPanel() {
  const qc = useQueryClient();
  const list = useServerFn(listStoreFeeds);
  const add = useServerFn(addStoreFeed);
  const toggle = useServerFn(toggleStoreFeed);
  const remove = useServerFn(deleteStoreFeed);
  const run = useServerFn(runStoreBotNow);

  const [storeName, setStoreName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [category, setCategory] = useState("");
  const [affiliate, setAffiliate] = useState("");

  const feeds = useQuery({
    queryKey: ["store-feeds"],
    queryFn: () => list({}) as Promise<Feed[]>,
  });

  const refreshAll = () => {
    void qc.invalidateQueries({ queryKey: ["store-feeds"] });
    void qc.invalidateQueries({ queryKey: REAL_DEALS_KEY, refetchType: "all" });
    void qc.invalidateQueries({ queryKey: ["sync-events"] });
  };

  const addMutation = useMutation({
    mutationFn: () =>
      add({
        data: {
          store_name: storeName,
          feed_url: feedUrl,
          category: category || "عام",
          affiliate_param: affiliate || null,
        },
      }),
    onSuccess: () => {
      toast.success("تمت إضافة المتجر إلى البوت");
      setStoreName("");
      setFeedUrl("");
      setCategory("");
      setAffiliate("");
      refreshAll();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "تعذّر إضافة المتجر"),
  });

  const runMutation = useMutation({
    mutationFn: (feedId?: string) => run({ data: feedId ? { feedId } : {} }),
    onSuccess: (result: {
      upserted: number;
      feeds: number;
      errors: Array<{ store: string; message: string }>;
    }) => {
      if (result.feeds === 0) toast.info("لا توجد متاجر مفعّلة في البوت بعد");
      else if (result.errors.length > 0)
        toast.warning(
          `جُلب ${result.upserted} عرضًا — تعذّر: ${result.errors.map((e) => e.store).join("، ")}`,
        );
      else toast.success(`تم جلب ${result.upserted} عرضًا من ${result.feeds} متجرًا`);
      refreshAll();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "تعذّر تشغيل البوت"),
  });

  const rows = feeds.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4 text-primary" />
          بوت جلب العروض من المتاجر
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => runMutation.mutate(undefined)}
          disabled={runMutation.isPending}
        >
          <RefreshCw className={`ml-1 h-4 w-4 ${runMutation.isPending ? "animate-spin" : ""}`} />
          تشغيل البوت الآن
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          أضف رابط تغذية المنتجات العامة للمتجر (RSS / Google Merchant / JSON) وسيجلب البوت عروضه
          تلقائياً كل ساعة ويعرضها ضمن «كل العروض» والخريطة.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">اسم المتجر</Label>
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="مثال: جرير"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">القسم</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="إلكترونيات"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">رابط تغذية المنتجات</Label>
            <Input
              dir="ltr"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://store.com/feed.xml"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">وسم الإحالة (اختياري)</Label>
            <Input
              dir="ltr"
              value={affiliate}
              onChange={(e) => setAffiliate(e.target.value)}
              placeholder="utm_source=hkeeem&ref=HKM11"
            />
          </div>
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending || !storeName.trim() || !feedUrl.trim()}
        >
          <Plus className="ml-1 h-4 w-4" />
          إضافة المتجر للبوت
        </Button>

        <div className="space-y-2">
          {feeds.isLoading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : feeds.isError ? (
            <div className="rounded-lg border p-3 text-xs text-destructive">
              تعذّر تحميل قائمة المتاجر.
              <Button size="sm" variant="ghost" onClick={() => feeds.refetch()}>
                إعادة المحاولة
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              لا توجد متاجر مضافة بعد.
            </p>
          ) : (
            rows.map((feed) => (
              <div key={feed.id} className="flex items-center gap-2 rounded-lg border p-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold">{feed.store_name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {feed.category}
                    </Badge>
                    {feed.last_count > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {feed.last_count} عرض
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
                    {feed.feed_url}
                  </p>
                  {feed.last_status && (
                    <p
                      className={`truncate text-[11px] ${feed.last_status.startsWith("failure") ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {feed.last_status.startsWith("failure")
                        ? feed.last_status.replace("failure:", "فشل:")
                        : "آخر تشغيل ناجح"}
                    </p>
                  )}
                </div>
                <Switch
                  checked={feed.active}
                  onCheckedChange={(active) =>
                    toggle({ data: { id: feed.id, active } }).then(refreshAll)
                  }
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => runMutation.mutate(feed.id)}
                  aria-label="تشغيل"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remove({ data: { id: feed.id } }).then(refreshAll)}
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
