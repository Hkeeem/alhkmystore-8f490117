import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  KeyRound,
  Newspaper,
  RefreshCw,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getIntegrationKeysStatus,
  removeIntegrationKeyValue,
  saveIntegrationKeyValue,
} from "@/lib/integration-keys.functions";
import { listMarketingPosts } from "@/lib/marketing-posts.functions";

const PLATFORMS: Array<{
  id: string;
  label: string;
  fields: Array<{ name: string; label: string; hint: string }>;
}> = [
  {
    id: "twitter",
    label: "تويتر (X)",
    fields: [
      { name: "TWITTER_API_KEY", label: "API Key", hint: "من لوحة مطوّري X" },
      { name: "TWITTER_API_SECRET", label: "API Secret", hint: "المفتاح السري للتطبيق" },
      { name: "TWITTER_ACCESS_TOKEN", label: "Access Token", hint: "رمز وصول الحساب" },
      { name: "TWITTER_ACCESS_SECRET", label: "Access Secret", hint: "سر رمز الوصول" },
    ],
  },
  {
    id: "instagram",
    label: "إنستغرام",
    fields: [
      { name: "INSTAGRAM_ACCESS_TOKEN", label: "Access Token", hint: "رمز Graph API طويل الأمد" },
      { name: "INSTAGRAM_BUSINESS_ID", label: "معرّف الحساب التجاري", hint: "Instagram Business ID" },
    ],
  },
  {
    id: "tiktok",
    label: "تيك توك",
    fields: [
      { name: "TIKTOK_ACCESS_TOKEN", label: "Access Token", hint: "من TikTok for Developers" },
      { name: "TIKTOK_CLIENT_KEY", label: "Client Key", hint: "مفتاح التطبيق" },
    ],
  },
  {
    id: "snapchat",
    label: "سناب شات",
    fields: [
      { name: "SNAPCHAT_ACCESS_TOKEN", label: "Access Token", hint: "من Snap Marketing API" },
      { name: "SNAPCHAT_PROFILE_ID", label: "معرّف الملف العام", hint: "Public Profile ID" },
    ],
  },
];

const STATUS_LABEL: Record<string, string> = {
  published: "منشور",
  pending: "بانتظار المفاتيح",
  failed: "فشل",
};

/** إعدادات مفاتيح النشر على منصات التواصل + آخر المنشورات المرتبطة بها. */
export function SocialKeysPanel() {
  const queryClient = useQueryClient();
  const fetchStatus = useServerFn(getIntegrationKeysStatus);
  const saveKey = useServerFn(saveIntegrationKeyValue);
  const removeKey = useServerFn(removeIntegrationKeyValue);
  const fetchPosts = useServerFn(listMarketingPosts);
  const [values, setValues] = useState<Record<string, string>>({});

  const statusQuery = useQuery({
    queryKey: ["integration-keys-status"],
    queryFn: () => fetchStatus(),
  });

  const postsQuery = useQuery({
    queryKey: ["marketing-posts"],
    queryFn: () => fetchPosts(),
  });

  const saveMutation = useMutation({
    mutationFn: async (platformId: string) => {
      const platform = PLATFORMS.find((p) => p.id === platformId);
      if (!platform) throw new Error("منصة غير معروفة");
      const entries = platform.fields
        .map((f) => [f.name, (values[f.name] ?? "").trim()] as const)
        .filter(([, v]) => v.length >= 3);
      if (entries.length === 0) throw new Error("أدخل مفتاحًا واحدًا على الأقل");
      for (const [name, value] of entries) {
        const res = await saveKey({ data: { name, value } });
        if (!res.ok) throw new Error(res.reason ?? "تعذّر الحفظ");
      }
      return { count: entries.length, label: platform.label };
    },
    onSuccess: ({ count, label }) => {
      toast.success(`تم حفظ ${count} مفتاحًا لمنصة ${label} بشكل مشفّر`);
      setValues({});
      void queryClient.invalidateQueries({ queryKey: ["integration-keys-status"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر حفظ المفاتيح"),
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => removeKey({ data: { name } }),
    onSuccess: () => {
      toast.success("تم حذف المفتاح");
      void queryClient.invalidateQueries({ queryKey: ["integration-keys-status"] });
    },
    onError: () => toast.error("تعذّر حذف المفتاح"),
  });

  const status = statusQuery.data ?? [];
  const isConfigured = (name: string) => status.find((s) => s.name === name)?.configured ?? false;
  const platformReady = (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    return platform ? platform.fields.every((f) => isConfigured(f.name)) : false;
  };

  const posts = postsQuery.data ?? [];

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            <KeyRound className="size-5 text-primary" aria-hidden="true" />
            مفاتيح النشر على منصات التواصل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            تُستخدم هذه المفاتيح في بوتات التسويق للنشر التلقائي مرتين يوميًا. تُخزَّن القيم مشفّرة
            ولا تُعرض مرة أخرى — تظهر حالتها فقط. ما لم تُضف المفاتيح تُحفظ المنشورات بحالة
            «بانتظار المفاتيح».
          </p>

          {statusQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            PLATFORMS.map((platform) => (
              <div key={platform.id} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{platform.label}</h3>
                  {platformReady(platform.id) ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="size-3" /> مفعّلة
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <XCircle className="size-3" /> ناقصة
                    </Badge>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {platform.fields.map((field) => (
                    <div key={field.name} className="space-y-1.5">
                      <Label htmlFor={field.name} className="flex items-center gap-2 text-xs">
                        {field.label}
                        {isConfigured(field.name) && (
                          <Badge variant="secondary" className="text-[10px]">
                            محفوظ
                          </Badge>
                        )}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={field.name}
                          type="password"
                          dir="ltr"
                          autoComplete="off"
                          placeholder={isConfigured(field.name) ? "••••••••" : field.hint}
                          value={values[field.name] ?? ""}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [field.name]: e.target.value }))
                          }
                        />
                        {isConfigured(field.name) && (
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`حذف ${field.label}`}
                            onClick={() => deleteMutation.mutate(field.name)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={() => saveMutation.mutate(platform.id)}
                  disabled={saveMutation.isPending}
                >
                  <Save className="size-4" aria-hidden="true" />
                  {saveMutation.isPending ? "جارٍ الحفظ…" : `حفظ مفاتيح ${platform.label}`}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            <Newspaper className="size-5 text-primary" aria-hidden="true" />
            آخر المنشورات
            <Button
              variant="ghost"
              size="icon"
              aria-label="تحديث"
              onClick={() => void postsQuery.refetch()}
              disabled={postsQuery.isFetching}
            >
              <RefreshCw
                className={`size-4 ${postsQuery.isFetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postsQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              لا توجد منشورات بعد — ستظهر هنا بعد أول تشغيل لبوتات التسويق.
            </p>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 text-sm"
                >
                  <Badge variant="secondary">{post.platform}</Badge>
                  <Badge
                    variant={post.status === "published" ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {STATUS_LABEL[post.status] ?? post.status}
                  </Badge>
                  <span className="flex-1 min-w-40 truncate">{post.title ?? post.content}</span>
                  <span className="text-xs text-muted-foreground" dir="ltr">
                    {new Date(post.created_at).toLocaleString("ar-SA")}
                  </span>
                  {post.error && (
                    <span className="w-full text-xs text-destructive">{post.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
