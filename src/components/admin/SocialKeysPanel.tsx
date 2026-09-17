import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, KeyRound, Save, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getIntegrationKeysStatus,
  removeIntegrationKeyValue,
  saveIntegrationKeyValue,
} from "@/lib/integration-keys.functions";

const GROUPS = [
  {
    title: "تويتر (X)",
    hint: "من لوحة developer.x.com ← مشروعك ← Keys and tokens.",
    fields: [
      { name: "TWITTER_API_KEY", label: "API Key" },
      { name: "TWITTER_API_SECRET", label: "API Secret" },
      { name: "TWITTER_ACCESS_TOKEN", label: "Access Token" },
      { name: "TWITTER_ACCESS_SECRET", label: "Access Token Secret" },
    ],
  },
  {
    title: "إنستغرام",
    hint: "حساب أعمال مرتبط بصفحة فيسبوك — من Meta for Developers.",
    fields: [
      { name: "INSTAGRAM_BUSINESS_ID", label: "معرّف حساب الأعمال" },
      { name: "INSTAGRAM_ACCESS_TOKEN", label: "Access Token" },
    ],
  },
  {
    title: "تيك توك",
    hint: "من TikTok for Developers ← Content Posting API.",
    fields: [
      { name: "TIKTOK_CLIENT_KEY", label: "Client Key" },
      { name: "TIKTOK_ACCESS_TOKEN", label: "Access Token" },
    ],
  },
  {
    title: "سناب شات",
    hint: "من Snapchat Business ← Public Profile API.",
    fields: [
      { name: "SNAPCHAT_PROFILE_ID", label: "معرّف الملف العام" },
      { name: "SNAPCHAT_ACCESS_TOKEN", label: "Access Token" },
    ],
  },
] as const;

/** لصق مفاتيح النشر لمنصات التواصل — تُخزَّن مشفّرة ولا تُعرض قيمتها أبدًا. */
export function SocialKeysPanel() {
  const qc = useQueryClient();
  const fetchStatus = useServerFn(getIntegrationKeysStatus);
  const saveKey = useServerFn(saveIntegrationKeyValue);
  const removeKey = useServerFn(removeIntegrationKeyValue);
  const [values, setValues] = useState<Record<string, string>>({});

  const statusQuery = useQuery({
    queryKey: ["integration-keys-status"],
    queryFn: () => fetchStatus(),
  });

  const configured = (name: string) =>
    Boolean(statusQuery.data?.find((s) => s.name === name)?.configured);

  const saveMutation = useMutation({
    mutationFn: async (names: readonly string[]) => {
      const entries = names
        .map((n) => [n, (values[n] ?? "").trim()] as const)
        .filter(([, v]) => v.length >= 3);
      if (entries.length === 0) throw new Error("أدخل قيمة واحدة على الأقل.");
      for (const [name, value] of entries) {
        const res = await saveKey({ data: { name, value } });
        if (!res.ok) throw new Error(res.reason ?? "تعذّر الحفظ");
      }
      return entries.map(([n]) => n);
    },
    onSuccess: (saved) => {
      setValues((prev) => {
        const next = { ...prev };
        for (const n of saved) delete next[n];
        return next;
      });
      toast.success("تم حفظ المفاتيح بشكل مشفّر");
      void qc.invalidateQueries({ queryKey: ["integration-keys-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (name: string) => removeKey({ data: { name } }),
    onSuccess: () => {
      toast.success("تم حذف المفتاح");
      void qc.invalidateQueries({ queryKey: ["integration-keys-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div dir="rtl" className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        الصق مفاتيح كل منصة هنا مرة واحدة. تُحفظ مشفّرة ولا تظهر قيمتها مجددًا. بعد الحفظ اذهب إلى
        تبويب «بوتات التسويق» واضغط «انشر الآن».
      </p>

      {GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              {group.title}
              {group.fields.every((f) => configured(f.name)) ? (
                <Badge className="text-[10px] gap-1">
                  <CheckCircle2 className="w-3 h-3" /> مربوط
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <XCircle className="w-3 h-3" /> غير مكتمل
                </Badge>
              )}
            </CardTitle>
            <p className="text-[12px] text-muted-foreground">{group.hint}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.fields.map((f) => (
              <div key={f.name} className="space-y-1">
                <Label className="text-[12px] flex items-center gap-2">
                  {f.label}
                  {configured(f.name) && (
                    <span className="text-[10px] text-emerald-500">محفوظ</span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    dir="ltr"
                    placeholder={configured(f.name) ? "••••••••  (محفوظ)" : "الصق القيمة هنا"}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((p) => ({ ...p, [f.name]: e.target.value }))}
                  />
                  {configured(f.name) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`حذف ${f.label}`}
                      onClick={() => removeMutation.mutate(f.name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              onClick={() => saveMutation.mutate(group.fields.map((f) => f.name))}
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 ml-1" />
              حفظ مفاتيح {group.title}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
