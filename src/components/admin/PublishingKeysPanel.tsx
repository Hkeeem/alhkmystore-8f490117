import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Save, Trash2, Loader2, CheckCircle2, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import {
  getIntegrationKeysStatus,
  saveIntegrationKeyValue,
  removeIntegrationKeyValue,
} from "@/lib/integration-keys.functions";

type PlatformGroup = {
  id: string;
  label: string;
  emoji: string;
  keys: Array<{ name: string; label: string; placeholder: string }>;
};

const GROUPS: PlatformGroup[] = [
  {
    id: "twitter",
    label: "تويتر (X)",
    emoji: "🐦",
    keys: [
      { name: "TWITTER_API_KEY", label: "API Key", placeholder: "مفتاح API من لوحة مطوري X" },
      { name: "TWITTER_API_SECRET", label: "API Secret", placeholder: "سر API" },
      { name: "TWITTER_ACCESS_TOKEN", label: "Access Token", placeholder: "رمز الوصول" },
      { name: "TWITTER_ACCESS_SECRET", label: "Access Secret", placeholder: "سر رمز الوصول" },
    ],
  },
  {
    id: "instagram",
    label: "إنستغرام",
    emoji: "📸",
    keys: [
      { name: "INSTAGRAM_ACCESS_TOKEN", label: "Access Token", placeholder: "رمز Graph API طويل الأمد" },
      { name: "INSTAGRAM_BUSINESS_ID", label: "Business Account ID", placeholder: "معرّف حساب الأعمال" },
    ],
  },
  {
    id: "tiktok",
    label: "تيك توك",
    emoji: "🎵",
    keys: [
      { name: "TIKTOK_ACCESS_TOKEN", label: "Access Token", placeholder: "رمز الوصول من TikTok for Developers" },
      { name: "TIKTOK_CLIENT_KEY", label: "Client Key", placeholder: "مفتاح العميل" },
    ],
  },
  {
    id: "snapchat",
    label: "سناب شات",
    emoji: "👻",
    keys: [
      { name: "SNAPCHAT_ACCESS_TOKEN", label: "Access Token", placeholder: "رمز Snap Business API" },
      { name: "SNAPCHAT_PROFILE_ID", label: "Public Profile ID", placeholder: "معرّف الملف العام" },
    ],
  },
];

function KeyField({
  name,
  label,
  placeholder,
  configured,
}: {
  name: string;
  label: string;
  placeholder: string;
  configured: boolean;
}) {
  const qc = useQueryClient();
  const saveFn = useServerFn(saveIntegrationKeyValue);
  const removeFn = useServerFn(removeIntegrationKeyValue);
  const [value, setValue] = useState("");

  const save = useMutation({
    mutationFn: () => saveFn({ data: { name, value } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(`حُفظ مفتاح ${label}`);
        setValue("");
        qc.invalidateQueries({ queryKey: ["integration-keys"] });
      } else toast.error(r.reason);
    },
    onError: () => toast.error("تعذّر الحفظ"),
  });

  const remove = useMutation({
    mutationFn: () => removeFn({ data: { name } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(`حُذف مفتاح ${label}`);
        qc.invalidateQueries({ queryKey: ["integration-keys"] });
      } else toast.error(r.reason);
    },
    onError: () => toast.error("تعذّر الحذف"),
  });

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold">{label}</label>
        {configured ? (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> مُضاف
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CircleDashed className="w-3.5 h-3.5" /> غير مُضاف
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={configured ? "•••••••• (أدخل قيمة جديدة للتحديث)" : placeholder}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background border border-border text-sm"
          dir="ltr"
        />
        <button
          onClick={() => save.mutate()}
          disabled={value.trim().length < 3 || save.isPending}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          aria-label={`حفظ ${label}`}
        >
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </button>
        {configured && (
          <button
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            className="px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-40"
            aria-label={`حذف ${label}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function PublishingKeysPanel() {
  const fetchStatus = useServerFn(getIntegrationKeysStatus);
  const q = useQuery({ queryKey: ["integration-keys"], queryFn: () => fetchStatus() });

  const configuredSet = new Set(
    (q.data ?? []).filter((k) => k.configured).map((k) => k.name as string),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          مفاتيح النشر على المنصات
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          تُحفظ المفاتيح مشفّرة في قاعدة البيانات ولا تُعرض بعد الحفظ. بدونها تُحفظ منشورات البوتات
          بحالة «بانتظار الربط» وتُنشر تلقائيًا بعد إضافة المفاتيح.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {GROUPS.map((group) => {
          const done = group.keys.filter((k) => configuredSet.has(k.name)).length;
          return (
            <div key={group.id} className="p-5 rounded-2xl border border-primary/20 bg-card shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-bold flex items-center gap-2">
                  <span>{group.emoji}</span> {group.label}
                </p>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    done === group.keys.length
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {done}/{group.keys.length}
                </span>
              </div>
              {group.keys.map((k) => (
                <KeyField
                  key={k.name}
                  name={k.name}
                  label={k.label}
                  placeholder={k.placeholder}
                  configured={configuredSet.has(k.name)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
