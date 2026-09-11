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
import { Skeleton } from "@/components/ui/skeleton";
import {
  getIntegrationKeysStatus,
  removeIntegrationKeyValue,
  saveIntegrationKeyValue,
} from "@/lib/integration-keys.functions";

const FIELDS = [
  {
    name: "NOON_AFFILIATE_API_KEY",
    label: "مفتاح واجهة الأفلييت (API Key)",
    hint: "من لوحة شريك نون أو شبكة الأفلييت المعتمدة.",
    required: true,
  },
  {
    name: "NOON_AFFILIATE_API_SECRET",
    label: "المفتاح السري (API Secret)",
    hint: "اتركه فارغًا إذا كانت لوحتك تستخدم مفتاحًا واحدًا فقط.",
    required: false,
  },
  {
    name: "NOON_AFFILIATE_API_BASE",
    label: "عنوان الواجهة (اختياري)",
    hint: "الافتراضي: https://affiliate-api.noon.com/v1",
    required: false,
  },
] as const;

/** إدخال مفاتيح واجهة أفلييت نون الرسمية — تُخزَّن مشفّرة ولا تُعرض قيمتها أبدًا. */
export function NoonApiKeysPanel() {
  const queryClient = useQueryClient();
  const fetchStatus = useServerFn(getIntegrationKeysStatus);
  const saveKey = useServerFn(saveIntegrationKeyValue);
  const removeKey = useServerFn(removeIntegrationKeyValue);
  const [values, setValues] = useState<Record<string, string>>({});

  const statusQuery = useQuery({
    queryKey: ["integration-keys-status"],
    queryFn: () => fetchStatus(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = FIELDS.map((f) => [f.name, (values[f.name] ?? "").trim()] as const).filter(
        ([, v]) => v.length >= 3,
      );
      if (entries.length === 0) throw new Error("أدخل مفتاحًا واحدًا على الأقل");
      for (const [name, value] of entries) {
        const res = await saveKey({ data: { name, value } });
        if (!res.ok) throw new Error(res.reason ?? "تعذّر الحفظ");
      }
      return entries.length;
    },
    onSuccess: (count) => {
      toast.success(
        `تم حفظ ${count} مفتاحًا بشكل مشفّر — ستُربط عروض نون تلقائيًا في المزامنة القادمة`,
      );
      setValues({});
      void queryClient.invalidateQueries({ queryKey: ["integration-keys-status"] });
      void queryClient.invalidateQueries({ queryKey: ["noon-campaign-status"] });
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

  return (
    <Card className="mb-6" dir="rtl">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <KeyRound className="size-5 text-primary" aria-hidden="true" />
          مفاتيح واجهة أفلييت نون
          {isConfigured("NOON_AFFILIATE_API_KEY") ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="size-3" /> مفعّلة
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <XCircle className="size-3" /> غير مضافة
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          عند إضافة المفاتيح تُسحب عروض نون تلقائيًا وتُدمج مع عروض التجّار في «كل العروض» بدل
          الاعتماد على كود الخصم فقط. تُخزَّن القيم مشفّرة ولا تظهر مرة أخرى.
        </p>

        {statusQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-4">
            {FIELDS.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name} className="flex flex-wrap items-center gap-2">
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
                    type={field.name === "NOON_AFFILIATE_API_BASE" ? "text" : "password"}
                    dir="ltr"
                    autoComplete="off"
                    placeholder={isConfigured(field.name) ? "••••••••" : field.hint}
                    value={values[field.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
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
                <p className="text-xs text-muted-foreground">{field.hint}</p>
              </div>
            ))}

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="size-4" aria-hidden="true" />
              {saveMutation.isPending ? "جارٍ الحفظ…" : "حفظ المفاتيح وتفعيل الربط التلقائي"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
