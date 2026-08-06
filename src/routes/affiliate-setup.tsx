import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Check, CircleDashed, ExternalLink, KeyRound, Link2, RefreshCw, ShoppingCart, Copy, PlugZap, PlayCircle, AlertTriangle, Receipt, ShieldCheck, Lock, Wifi, XCircle, ArrowLeftRight, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getSyncFailures, getAffiliateKeyStatus, getSyncOverview, runExternalSyncNow, getConversionsOverview, getPostbackStatus, getNoonCampaignStatus, verifyNoonPublisherId } from "@/lib/affiliate-setup.functions";
import { getIntegrationKeysStatus, saveIntegrationKeyValue, removeIntegrationKeyValue, testAmazonConnection } from "@/lib/integration-keys.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/affiliate-setup")({
  head: () => ({
    meta: [
      { title: "دليل تفعيل أمازون ونون — HkeeemAI" },
      { name: "description", content: "دليل خطوة بخطوة لتفعيل Amazon PA-API وتهيئة حملة noon وربط المفاتيح بتطبيق حكيم AI لتشغيل العروض الحقيقية." },
      { property: "og:title", content: "دليل تفعيل أمازون ونون — HkeeemAI" },
      { property: "og:description", content: "خطوات مرتبة لتفعيل واجهة أمازون للشركاء وحملة نون ثم ربطها بالتطبيق." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AffiliateSetupPage,
});

type Step = {
  id: string;
  title: string;
  body: string[];
  link?: { href: string; label: string };
  copy?: string;
};

const AMAZON_STEPS: Step[] = [
  {
    id: "az-1",
    title: "١) سجّل في برنامج أمازون للشركاء (Amazon Associates)",
    body: [
      "افتح موقع برنامج الشركاء لسوق السعودية وسجّل بحساب أمازون.",
      "أدخل بيانات الموقع: أضف رابط تطبيق حكيم AI كمصدر ترويج، واختر التصنيف «تسوّق ومقارنة أسعار».",
      "بعد الاعتماد ستحصل على معرّف الشريك (Partner Tag) بصيغة مثل hkeeem-21.",
    ],
    link: { href: "https://affiliate-program.amazon.sa/", label: "affiliate-program.amazon.sa" },
  },
  {
    id: "az-2",
    title: "٢) حقّق شرط المبيعات الثلاث",
    body: [
      "أمازون لا تفتح واجهة PA-API إلا بعد تحقيق ٣ عمليات شراء مؤهلة عبر روابطك خلال ١٨٠ يومًا.",
      "استخدم روابط التتبع الجاهزة داخل التطبيق (/api/public/go/...) لأن كل نقرة تمر بها تحمل وسم الشريك تلقائيًا.",
    ],
  },
  {
    id: "az-3",
    title: "٣) أنشئ مفاتيح PA-API 5.0",
    body: [
      "من لوحة الشركاء اذهب إلى Tools ← Product Advertising API ← Join / Manage Credentials.",
      "اضغط Add Credentials وستحصل على Access Key و Secret Key (يظهر السر مرة واحدة فقط — احفظه فورًا).",
      "المنطقة الصحيحة لسوق السعودية: eu-west-1 والمضيف webservices.amazon.sa.",
    ],
    link: { href: "https://webservices.amazon.com/paapi5/documentation/", label: "توثيق PA-API 5.0" },
  },
  {
    id: "az-4",
    title: "٤) سلّمني المفاتيح الثلاثة",
    body: [
      "أخبرني «جاهز مفاتيح أمازون» وسأفتح لك نموذج إدخال آمن للمفاتيح التالية، ولا تُكتب أبدًا داخل الكود:",
      "AMAZON_ACCESS_KEY — AMAZON_SECRET_KEY — AMAZON_PARTNER_TAG",
    ],
    copy: "AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG",
  },
];

const NOON_STEPS: Step[] = [
  {
    id: "noon-1",
    title: "١) سجّل في برنامج noon للتسويق بالعمولة",
    body: [
      "برنامج نون يُدار عبر شبكات الأفلييت (مثل Admitad أو Arabyads/Boostiny) أو عبر التسجيل المباشر في noon Affiliates.",
      "اختر السوق: السعودية (noon.com/saudi-ar)، ونوع الناشر: تطبيق مقارنة أسعار وكوبونات.",
    ],
    link: { href: "https://www.noon.com/saudi-ar/", label: "noon.com" },
  },
  {
    id: "noon-2",
    title: "٢) أنشئ الحملة (Campaign) واحصل على معرّف الناشر",
    body: [
      "بعد الاعتماد أنشئ حملة باسم «HkeeemAI — Price Comparison».",
      "اضبط نموذج العمولة CPS واختر تتبّع الروابط العميقة (Deep Link) حتى يفتح المنتج مباشرة.",
      "انسخ معرّف الناشر / الحملة (Affiliate ID أو utm_source المخصص).",
    ],
  },
  {
    id: "noon-3",
    title: "٣) فعّل الروابط العميقة",
    body: [
      "في إعدادات الحملة فعّل Deep Linking حتى يعمل رابط التحويل لدينا: /api/public/go/<معرّف العرض>.",
      "أضف نطاق التطبيق المنشور ضمن النطاقات المسموح بها في الحملة.",
    ],
    copy: "https://alhkmystore.lovable.app",
  },
  {
    id: "noon-4",
    title: "٤) سلّمني معرّف الحملة",
    body: [
      "أخبرني «جاهز معرّف نون» لأفتح نموذج إدخال آمن للمفتاح:",
      "NOON_AFFILIATE_ID",
    ],
    copy: "NOON_AFFILIATE_ID",
  },
];

const LINK_STEPS: Step[] = [
  {
    id: "app-1",
    title: "١) حفظ المفاتيح داخل التطبيق",
    body: [
      "المفاتيح تُخزَّن في الخزنة السرية للتطبيق وتُقرأ من الخادم فقط، ولا تصل للمتصفح إطلاقًا.",
      "بمجرد حفظها تتحول مؤشرات الحالة أدناه إلى «مُفعّل».",
    ],
  },
  {
    id: "app-2",
    title: "٢) التزامن التلقائي",
    body: [
      "المهمة المجدولة تعمل كل ٦ ساعات وتسحب الأسعار والتوفر من أمازون ونون وتحدّث قاعدة البيانات.",
      "أي عرض خارجي لا يتحدث خلال ٢٤ ساعة يُوقَف تلقائيًا حتى لا يُعرض سعر قديم.",
    ],
  },
  {
    id: "app-3",
    title: "٣) التحقق من العمولة",
    body: [
      "افتح أي عرض واضغط «اذهب للمتجر» — الرابط يمر عبر التحويل الخادمي مع وسوم الشريك و UTM.",
      "راجع سجل النقرات في لوحة التحكم بعد ساعة، ثم قارنه بلوحة الشبكة (أمازون / نون) بعد ٢٤ ساعة.",
    ],
  },
];

const STORAGE_KEY = "hkeeem-affiliate-setup-progress";
const ALL_STEPS = [...AMAZON_STEPS, ...NOON_STEPS, ...LINK_STEPS];

function AffiliateSetupPage() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const fetchStatus = useServerFn(getAffiliateKeyStatus);
  const { data: status, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["affiliate-key-status"],
    queryFn: () => fetchStatus({}),
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const completed = ALL_STEPS.filter((s) => done[s.id]).length;
  const percent = Math.round((completed / ALL_STEPS.length) * 100);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم النسخ");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  const keyRows = [
    { label: "AMAZON_ACCESS_KEY", ok: status?.amazonAccessKey },
    { label: "AMAZON_SECRET_KEY", ok: status?.amazonSecretKey },
    { label: "AMAZON_PARTNER_TAG", ok: status?.amazonPartnerTag },
    { label: "NOON_AFFILIATE_ID", ok: status?.noonAffiliateId },
  ];

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      <header id="top" className="space-y-3 scroll-mt-24">
        <Badge variant="secondary" className="gap-1"><Link2 className="size-3" /> ربط المصادر الحقيقية</Badge>
        <h1 className="text-3xl font-bold">دليل تفعيل أمازون ونون خطوة بخطوة</h1>
        <p className="text-muted-foreground">
          اتبع الخطوات بالترتيب لتفعيل واجهة أمازون للشركاء (PA-API) وتهيئة حملة نون، ثم ربطهما بتطبيق حكيم AI
          ليبدأ سحب العروض والأسعار الحقيقية تلقائيًا.
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">تقدّمك</span>
            <span className="font-semibold">{completed} / {ALL_STEPS.length}</span>
          </div>
          <Progress value={percent} />
        </div>
      </header>

      <ReadinessPanel status={status} statusLoading={isLoading} />

      <SyncFailuresPanel />

      <ConversionsPanel />

      <div id="noon-campaign" className="scroll-mt-24">
        <NoonCampaignPanel />
      </div>

      <div id="noon-audit" className="scroll-mt-24">
        <NoonAuditPanel />
      </div>

      <div id="secure-keys" className="scroll-mt-24">
        <SecureKeysPanel />
      </div>


      <Card className="hover-lift">


        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg"><KeyRound className="size-5" /> حالة المفاتيح</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="press-ripple">
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {keyRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <code className="text-xs sm:text-sm" dir="ltr">{row.label}</code>
              {isLoading ? (
                <span className="text-xs text-muted-foreground">جارٍ الفحص…</span>
              ) : row.ok ? (
                <Badge className="gap-1"><Check className="size-3" /> مُفعّل</Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-muted-foreground"><CircleDashed className="size-3" /> غير مُضاف</Badge>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            القيم مخزّنة مشفّرة داخل قاعدة البيانات ولا تُعرض هنا إطلاقًا — تظهر الحالة فقط. استخدم بطاقة «تخزين آمن ومشفّر للمفاتيح» بالأعلى للإدخال أو التحديث.
          </p>
        </CardContent>
      </Card>

      <div id="steps" className="scroll-mt-24" />

      <StepSection
        icon={<ShoppingCart className="size-5" />}
        title="أولًا: Amazon PA-API"
        steps={AMAZON_STEPS}
        done={done}
        toggle={toggle}
        copyText={copyText}
      />
      <Separator />
      <StepSection
        icon={<ShoppingCart className="size-5" />}
        title="ثانيًا: حملة noon"
        steps={NOON_STEPS}
        done={done}
        toggle={toggle}
        copyText={copyText}
      />
      <Separator />
      <StepSection
        icon={<Link2 className="size-5" />}
        title="ثالثًا: الربط بالتطبيق والتحقق"
        steps={LINK_STEPS}
        done={done}
        toggle={toggle}
        copyText={copyText}
      />
    </main>
  );
}

function StepSection({
  icon, title, steps, done, toggle, copyText,
}: {
  icon: React.ReactNode;
  title: string;
  steps: Step[];
  done: Record<string, boolean>;
  toggle: (id: string) => void;
  copyText: (text: string) => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold">{icon}{title}</h2>
      <ol className="space-y-3">
        {steps.map((step) => {
          const isDone = Boolean(done[step.id]);
          return (
            <li key={step.id}>
              <Card className={`hover-lift transition-colors ${isDone ? "border-primary/60 bg-primary/5" : ""}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(step.id)}
                      aria-pressed={isDone}
                      aria-label={isDone ? `إلغاء إتمام: ${step.title}` : `تعليم كمنجَز: ${step.title}`}
                      className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border press-ripple ${isDone ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/40"}`}
                    >
                      {isDone ? <Check className="size-4" /> : null}
                    </button>
                    <div className="space-y-2">
                      <h3 className={`font-semibold ${isDone ? "line-through opacity-70" : ""}`}>{step.title}</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground list-disc pr-4">
                        {step.body.map((line) => <li key={line}>{line}</li>)}
                      </ul>
                    </div>
                  </div>
                  {(step.link || step.copy) && (
                    <div className="flex flex-wrap gap-2 pr-9">
                      {step.link && (
                        <Button asChild variant="outline" size="sm" className="press-ripple">
                          <a href={step.link.href} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-4" /> {step.link.label}
                          </a>
                        </Button>
                      )}
                      {step.copy && (
                        <Button variant="ghost" size="sm" className="press-ripple" onClick={() => copyText(step.copy!)}>
                          <Copy className="size-4" /> نسخ
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

type KeyStatus = {
  amazonAccessKey: boolean;
  amazonSecretKey: boolean;
  amazonPartnerTag: boolean;
  noonAffiliateId: boolean;
};

function formatWhen(iso: string | null) {
  if (!iso) return "لم يتم بعد";
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  return `قبل ${Math.round(h / 24)} يوم`;
}

function ReadinessPanel({ status, statusLoading }: { status?: KeyStatus; statusLoading: boolean }) {
  const { user } = useAuth();
  const fetchOverview = useServerFn(getSyncOverview);
  const startSync = useServerFn(runExternalSyncNow);
  const runAmazonTest = useServerFn(testAmazonConnection);
  const [amazonTest, setAmazonTest] = useState<{ ok: boolean; message: string; testedAt: string } | null>(null);

  const amazonCheck = useMutation({
    mutationFn: () => runAmazonTest({}),
    onSuccess: (res) => {
      setAmazonTest({ ok: res.ok, message: res.message, testedAt: res.testedAt });
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    },
    onError: () => {
      setAmazonTest({ ok: false, message: "غير مصرّح — اختبار الاتصال متاح للمشرفين فقط.", testedAt: new Date().toISOString() });
      toast.error("غير مصرّح لك بإجراء الاختبار");
    },
  });

  const { data: overview, refetch: refetchOverview, isFetching: overviewFetching } = useQuery({
    queryKey: ["external-sync-overview"],
    queryFn: () => fetchOverview({}),
  });

  type SyncKey = "amazon" | "noon" | "all";
  const [progress, setProgress] = useState<Record<SyncKey, { value: number; stage: string; done?: "ok" | "fail" } | null>>({
    amazon: null,
    noon: null,
    all: null,
  });
  const timersRef = useRef<Record<string, ReturnType<typeof setInterval> | undefined>>({});

  useEffect(() => () => {
    Object.values(timersRef.current).forEach((t) => t && clearInterval(t));
  }, []);

  const startProgress = (key: SyncKey) => {
    const stages = ["الاتصال بالمصدر…", "سحب العروض…", "تحليل الأسعار…", "حفظ التحديثات…"];
    let value = 6;
    setProgress((p) => ({ ...p, [key]: { value, stage: stages[0]! } }));
    timersRef.current[key] && clearInterval(timersRef.current[key]!);
    timersRef.current[key] = setInterval(() => {
      value = Math.min(92, value + Math.random() * 9);
      const stage = stages[Math.min(stages.length - 1, Math.floor(value / 25))]!;
      setProgress((p) => ({ ...p, [key]: { value, stage } }));
    }, 700);
  };

  const endProgress = (key: SyncKey, ok: boolean, stage: string) => {
    timersRef.current[key] && clearInterval(timersRef.current[key]!);
    setProgress((p) => ({ ...p, [key]: { value: 100, stage, done: ok ? "ok" : "fail" } }));
  };

  const sync = useMutation({
    mutationFn: (source: SyncKey) => {
      startProgress(source);
      return startSync({ data: { source } });
    },
    onSuccess: (res, source) => {
      if (res.success) {
        const count = source === "amazon" ? res.sources.amazon : source === "noon" ? res.sources.noon : res.upserted;
        endProgress(source, true, `اكتملت المزامنة — ${count} عرضًا`);
        toast.success(
          source === "all"
            ? `تم التحديث — ${res.upserted} عرضًا (أمازون ${res.sources.amazon} / نون ${res.sources.noon})`
            : `تم تحديث ${source === "amazon" ? "أمازون" : "نون"} — ${count} عرضًا`,
        );
        refetchOverview();
      } else {
        endProgress(source, false, "تعذّر إكمال المزامنة");
        toast.error("تعذّر تشغيل التحديث، حاول لاحقًا");
      }
    },
    onError: (_e, source) => {
      endProgress(source, false, "غير مصرّح بتشغيل التحديث");
      toast.error("غير مصرّح لك بتشغيل التحديث");
    },
  });

  const runningKey = sync.isPending ? (sync.variables as SyncKey) : null;

  const amazonReady = Boolean(status?.amazonAccessKey && status?.amazonSecretKey && status?.amazonPartnerTag);
  const noonReady = Boolean(status?.noonAffiliateId);
  const anyReady = amazonReady || noonReady;

  const sources = [
    {
      key: "amazon" as const,
      name: "Amazon",
      ready: amazonReady,
      missing: [
        !status?.amazonAccessKey && "AMAZON_ACCESS_KEY",
        !status?.amazonSecretKey && "AMAZON_SECRET_KEY",
        !status?.amazonPartnerTag && "AMAZON_PARTNER_TAG",
      ].filter(Boolean) as string[],
      active: overview?.amazon.active ?? 0,
      last: overview?.amazon.lastFetchedAt ?? null,
    },
    {
      key: "noon" as const,
      name: "noon",
      ready: noonReady,
      missing: [!status?.noonAffiliateId && "NOON_AFFILIATE_ID"].filter(Boolean) as string[],
      active: overview?.noon.active ?? 0,
      last: overview?.noon.lastFetchedAt ?? null,
    },
  ];

  return (
    <Card className="hover-lift border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg"><PlugZap className="size-5" /> جاهزية الربط</CardTitle>
        <Button variant="ghost" size="sm" className="press-ripple" onClick={() => refetchOverview()} disabled={overviewFetching}>
          <RefreshCw className={`size-4 ${overviewFetching ? "animate-spin" : ""}`} /> تحديث الحالة
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {sources.map((s) => (
            <div key={s.name} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold" dir="ltr">{s.name}</span>
                {statusLoading ? (
                  <span className="text-xs text-muted-foreground">جارٍ الفحص…</span>
                ) : s.ready ? (
                  <Badge className="gap-1"><Check className="size-3" /> جاهز</Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground"><AlertTriangle className="size-3" /> ناقص</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>عروض نشطة: <span className="font-semibold text-foreground">{s.active}</span></p>
                <p>آخر تحديث: {formatWhen(s.last)}</p>
                {s.missing.length > 0 && (
                  <p dir="ltr" className="text-[11px]">ينقص: {s.missing.join(" · ")}</p>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full press-ripple"
                  disabled={!user || !s.ready || sync.isPending}
                  onClick={() => sync.mutate(s.key)}
                >
                  {runningKey === s.key ? <RefreshCw className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                  {runningKey === s.key ? "جارٍ التحديث…" : `تحديث ${s.name} الآن`}
                </Button>
                {progress[s.key] && (
                  <div className="space-y-1" role="status" aria-live="polite">
                    <Progress value={progress[s.key]!.value} aria-label={`تقدّم مزامنة ${s.name}`} />
                    <p
                      className={`text-[11px] ${
                        progress[s.key]!.done === "fail" ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {progress[s.key]!.stage}
                    </p>
                  </div>
                )}
              </div>

              {s.name === "Amazon" && (
                <div className="space-y-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full press-ripple"
                    disabled={!user || amazonCheck.isPending}
                    onClick={() => amazonCheck.mutate()}
                  >
                    {amazonCheck.isPending ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <Wifi className="size-4" />
                    )}
                    {amazonCheck.isPending ? "جارٍ الاختبار…" : "اختبار الاتصال"}
                  </Button>
                  {amazonTest && (
                    <div
                      role="status"
                      aria-live="polite"
                      className={`flex items-start gap-2 rounded-lg border p-2 text-[11px] ${
                        amazonTest.ok
                          ? "border-primary/40 bg-primary/5 text-foreground"
                          : "border-destructive/40 bg-destructive/5 text-foreground"
                      }`}
                    >
                      {amazonTest.ok ? (
                        <Check className="size-3.5 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="size-3.5 mt-0.5 shrink-0" />
                      )}
                      <span>
                        {amazonTest.message}
                        <span className="block text-muted-foreground">آخر اختبار: {formatWhen(amazonTest.testedAt)}</span>
                      </span>
                    </div>
                  )}
                  {!user && (
                    <p className="text-[11px] text-muted-foreground">سجّل الدخول بحساب مشرف لتشغيل الاختبار.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {!user ? (
          <p className="text-xs text-muted-foreground">سجّل الدخول بحساب إداري لتشغيل التحديثات يدويًا.</p>
        ) : !anyReady ? (
          <p className="text-xs text-muted-foreground">أكمل إضافة مفاتيح مصدر واحد على الأقل ليُفعَّل زر بدء التحديثات.</p>
        ) : null}

        <Button
          className="w-full press-ripple"
          disabled={!anyReady || !user || sync.isPending}
          onClick={() => sync.mutate("all")}
        >
          {runningKey === "all" ? <RefreshCw className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
          {runningKey === "all" ? "جارٍ سحب العروض…" : "تحديث كل المصادر الآن"}
        </Button>
        {progress.all && (
          <div className="space-y-1" role="status" aria-live="polite">
            <Progress value={progress.all.value} aria-label="تقدّم مزامنة كل المصادر" />
            <p className={`text-[11px] text-center ${progress.all.done === "fail" ? "text-destructive" : "text-muted-foreground"}`}>
              {progress.all.stage}
            </p>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground text-center">
          التحديث التلقائي يعمل كل ٦ ساعات؛ هذا الزر لتشغيل دورة فورية.
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------- أسباب آخر فشل للتحديث لكل مصدر ------------------- */

const FAILURE_GUIDE: Record<string, { title: string; hint: string; fixes: Array<{ label: string; href: string; external?: boolean }> }> = {
  missing_keys: {
    title: "إعدادات ناقصة",
    hint: "لم تُحفظ كل المفاتيح المطلوبة، لذلك تخطّى النظام هذا المصدر.",
    fixes: [
      { label: "أضف المفاتيح الآن", href: "#secure-keys" },
      { label: "اذهب لخطوات الإعداد", href: "#steps" },
    ],
  },
  auth_error: {
    title: "مفاتيح غير صالحة أو توقيع خاطئ",
    hint: "رفضت أمازون الطلب: تأكد من Access Key و Secret Key وأنهما لنفس الحساب.",
    fixes: [
      { label: "حدّث المفاتيح", href: "#secure-keys" },
      { label: "لوحة مفاتيح أمازون", href: "https://affiliate-program.amazon.sa/assoc_credentials/home", external: true },
    ],
  },
  partner_tag_invalid: {
    title: "Partner Tag غير مقبول",
    hint: "وسم الشريك غير مرتبط بحساب PA-API أو مكتوب بشكل خاطئ.",
    fixes: [
      { label: "صحّح Partner Tag", href: "#secure-keys" },
      { label: "إدارة أوسمة التتبع", href: "https://affiliate-program.amazon.sa/home/tags", external: true },
    ],
  },
  throttled: {
    title: "تجاوز حد الطلبات",
    hint: "المصدر أرجع 429؛ ستُعاد المحاولة في الدورة القادمة تلقائيًا.",
    fixes: [{ label: "شغّل دورة يدوية لاحقًا", href: "#top" }],
  },
  http_error: {
    title: "استجابة غير متوقعة من المصدر",
    hint: "رفض المصدر الطلب أو تغيّرت واجهته؛ راجع الإعدادات ثم أعد المحاولة.",
    fixes: [
      { label: "راجع الإعدادات", href: "#secure-keys" },
      { label: "أعد اختبار الاتصال", href: "#top" },
    ],
  },
  network_error: {
    title: "تعذّر الاتصال",
    hint: "انقطع الاتصال بخوادم المصدر أو انتهت المهلة.",
    fixes: [{ label: "أعد تشغيل التحديث", href: "#top" }],
  },
  upsert_failed: {
    title: "فشل حفظ العروض في قاعدة البيانات",
    hint: "وصلت العروض لكن تعذّر تخزينها؛ أعد المحاولة وإن تكرر راجع سجل الأخطاء.",
    fixes: [{ label: "أعد تشغيل التحديث", href: "#top" }],
  },
  empty_result: {
    title: "لم تصل أي عروض",
    hint: "لم يُرجع المصدر نتائج — غالبًا بسبب مفاتيح ناقصة أو رفض الواجهة.",
    fixes: [
      { label: "أكمل الإعدادات", href: "#secure-keys" },
      { label: "راجع حملة نون", href: "#noon-campaign" },
    ],
  },
};

function SyncFailuresPanel() {
  const fetchFailures = useServerFn(getSyncFailures);
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["sync-failures"],
    queryFn: () => fetchFailures({}),
  });

  const rows = [
    { key: "amazon", label: "Amazon", info: data?.amazon ?? null },
    { key: "noon", label: "noon", info: data?.noon ?? null },
  ];

  return (
    <Card className="hover-lift border-destructive/25">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LifeBuoy className="size-5" /> أسباب آخر فشل للتحديث
        </CardTitle>
        <Button variant="ghost" size="sm" className="press-ripple" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> تحديث
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ key, label, info }) => {
          const guide = info ? FAILURE_GUIDE[info.code] ?? FAILURE_GUIDE["http_error"]! : null;
          const recovered = Boolean(info?.recoveredAt);
          return (
            <div
              key={key}
              className={`rounded-xl border p-3 space-y-2 ${
                info && !recovered ? "border-destructive/40 bg-destructive/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold" dir="ltr">{label}</span>
                {!info ? (
                  <Badge variant="outline" className="gap-1 text-muted-foreground"><Check className="size-3" /> لا فشل مسجّل</Badge>
                ) : recovered ? (
                  <Badge variant="outline" className="gap-1"><Check className="size-3" /> عاد للعمل</Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1"><XCircle className="size-3" /> يحتاج إصلاح</Badge>
                )}
              </div>

              {!info || !guide ? (
                <p className="text-xs text-muted-foreground">لم يُسجَّل أي فشل لهذا المصدر حتى الآن.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{guide.title}</p>
                  <p className="text-xs text-muted-foreground">{guide.hint}</p>
                  {info.message && (
                    <p className="text-[11px] text-muted-foreground rounded-md bg-muted/50 p-2" dir="auto">
                      {info.message}{info.keyword ? ` — أثناء البحث عن «${info.keyword}»` : ""}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">وقت الفشل: {formatWhen(info.at)}</p>
                  {recovered && (
                    <p className="text-[11px] text-muted-foreground">آخر نجاح بعده: {formatWhen(info.recoveredAt)}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {guide.fixes.map((fix) => (
                      <Button
                        key={fix.label}
                        asChild
                        size="sm"
                        variant="outline"
                        className="press-ripple h-8 text-xs"
                      >
                        <a
                          href={fix.href}
                          {...(fix.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {fix.external ? <ExternalLink className="size-3.5" /> : <ArrowLeftRight className="size-3.5" />}
                          {fix.label}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ConversionsPanel() {
  const { user } = useAuth();
  const fetchConversions = useServerFn(getConversionsOverview);
  const fetchPostback = useServerFn(getPostbackStatus);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const { data: postback } = useQuery({
    queryKey: ["postback-status"],
    queryFn: () => fetchPostback({}),
  });

  const { data, refetch, isFetching, isError } = useQuery({
    queryKey: ["affiliate-conversions-overview"],
    queryFn: () => fetchConversions({}),
    enabled: Boolean(user),
    retry: false,
  });

  const nets: { key: "amazon" | "noon" | "other"; label: string }[] = [
    { key: "amazon", label: "Amazon" },
    { key: "noon", label: "noon" },
    { key: "other", label: "شبكات أخرى" },
  ];

  const postbackUrl = `${origin}/api/public/postback/{network}?key=YOUR_SECRET&order_id={order_id}&click_id={subid}&amount={sale_amount}&commission={payout}&status=approved`;

  return (
    <Card className="hover-lift border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg"><Receipt className="size-5" /> تتبّع المبيعات (Postback)</CardTitle>
        <Button variant="ghost" size="sm" className="press-ripple" onClick={() => refetch()} disabled={isFetching || !user}>
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> تحديث
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs">
          {postback?.configured ? (
            <Badge className="gap-1"><Check className="size-3" /> مفتاح الـ Postback مُفعّل</Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground"><AlertTriangle className="size-3" /> يلزم إضافة AFFILIATE_POSTBACK_SECRET</Badge>
          )}
        </div>

        <div className="rounded-xl border bg-muted/40 p-3 space-y-2">
          <p className="text-xs text-muted-foreground">الصق هذا الرابط في إعدادات Postback لدى الشبكة (استبدل الوسوم بمتغيّرات الشبكة):</p>
          <code dir="ltr" className="block break-all text-[11px] leading-relaxed">{postbackUrl}</code>
          <Button
            variant="secondary"
            size="sm"
            className="press-ripple"
            onClick={() => {
              navigator.clipboard.writeText(postbackUrl);
              toast.success("تم نسخ رابط الـ Postback");
            }}
          >
            <Copy className="size-4" /> نسخ الرابط
          </Button>
          <p className="text-[11px] text-muted-foreground">
            نمرّر معرّف النقرة تلقائيًا للشبكة عبر <span dir="ltr">subid</span> (وأمازون عبر <span dir="ltr">ascsubtag</span>)، فتُرجعه الشبكة لنا لنربط كل عملية بيع بنقرتها.
          </p>
        </div>

        {!user ? (
          <p className="text-xs text-muted-foreground">سجّل الدخول بحساب إداري لعرض إحصائيات التحويلات.</p>
        ) : isError ? (
          <p className="text-xs text-muted-foreground">هذه الإحصائيات متاحة للمشرفين فقط.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {nets.map((n) => {
              const s = data?.[n.key];
              return (
                <div key={n.key} className="rounded-xl border p-3 space-y-1">
                  <span className="font-semibold" dir="ltr">{n.label}</span>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>عمليات (٣٠ يومًا): <span className="font-semibold text-foreground">{s?.count ?? 0}</span></p>
                    <p>مؤكدة: <span className="font-semibold text-foreground">{s?.approved ?? 0}</span></p>
                    <p>المبيعات: <span className="font-semibold text-foreground">{(s?.sales ?? 0).toFixed(2)} ر.س</span></p>
                    <p>العمولة: <span className="font-semibold text-foreground">{(s?.commission ?? 0).toFixed(2)} ر.س</span></p>
                    <p>آخر عملية: {formatWhen(s?.lastAt ?? null)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const NOON_CHOICE_KEY = "hkeeem-noon-campaign";

function NoonCampaignPanel() {
  const fetchNoon = useServerFn(getNoonCampaignStatus);
  const verify = useServerFn(verifyNoonPublisherId);
  const logEvent = useServerFn(logNoonCampaignEvent);
  const queryClient = useQueryClient();
  const recordEvent = (payload: Parameters<typeof logNoonCampaignEvent>[0]["data"]) => {
    void logEvent({ data: payload })
      .then(() => queryClient.invalidateQueries({ queryKey: ["noon-audit-log"] }))
      .catch(() => { /* التسجيل لا يعطّل العملية */ });
  };
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["noon-campaign-status"],
    queryFn: () => fetchNoon({}),
  });

  const [selected, setSelected] = useState<string | null>(null);
  const [publisherId, setPublisherId] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; text: string; tone: "ok" | "warn" | "bad" }>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOON_CHOICE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { campaignId?: string; publisherId?: string };
        if (parsed.campaignId) setSelected(parsed.campaignId);
        if (parsed.publisherId) setPublisherId(parsed.publisherId);
      }
    } catch { /* ignore */ }
  }, []);

  // اختيار تلقائي للحملة الموصى بها عند أول تحميل
  useEffect(() => {
    if (!selected && data?.recommended) setSelected(data.recommended);
  }, [data?.recommended, selected]);

  const confirmMutation = useMutation({
    mutationFn: (id: string) => verify({ data: { publisherId: id } }),
    onSuccess: (res) => {
      if (!res.ok) {
        setResult({ ok: false, text: res.reason, tone: "bad" });
        toast.error(res.reason);
        return;
      }
      const auto = res.campaignId;
      recordEvent({
        action: "noon_verify_publisher",
        campaignId: auto,
        campaignName: res.campaignName,
        network: res.network,
        publisherId,
        result: res.matchesStored === true ? "مطابق للمعرّف المحفوظ" : res.matchesStored === false ? "غير مطابق للمعرّف المحفوظ" : "تحقق من الصيغة فقط",
      });
      setSelected(auto);
      try {
        localStorage.setItem(NOON_CHOICE_KEY, JSON.stringify({ campaignId: auto, publisherId }));
      } catch { /* ignore */ }
      if (res.matchesStored === true) {
        setResult({ ok: true, text: `مطابق للمعرّف المحفوظ داخل التطبيق — الحملة: ${res.campaignName}.`, tone: "ok" });
        toast.success("تم تأكيد Publisher ID ✓");
      } else if (res.matchesStored === false) {
        setResult({ ok: false, text: `الصيغة صحيحة لكنه لا يطابق المعرّف المحفوظ حاليًا. حدّث NOON_AFFILIATE_ID إن كان هذا هو الصحيح. الحملة المقترحة: ${res.campaignName}.`, tone: "warn" });
        toast.warning("المعرّف لا يطابق المحفوظ");
      } else {
        setResult({ ok: true, text: `الصيغة صحيحة. الحملة المقترحة تلقائيًا: ${res.campaignName} (${res.network}). احفظ المعرّف داخل التطبيق لتفعيل الربط.`, tone: "warn" });
        toast.success("تم التحقق من الصيغة");
      }
    },
    onError: () => toast.error("تعذّر التحقق"),
  });

  const chosen = data?.campaigns.find((c) => c.id === selected) ?? null;

  return (
    <Card className="hover-lift">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PlugZap className="size-5" /> حملة noon و Publisher ID
        </CardTitle>
        <div className="flex items-center gap-2">
          {isLoading ? null : data?.linked ? (
            <Badge className="gap-1"><Check className="size-3" /> مربوطة بالفعل</Badge>
          ) : data?.configured ? (
            <Badge variant="secondary" className="gap-1"><CircleDashed className="size-3" /> بانتظار أول نقرة</Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground"><AlertTriangle className="size-3" /> غير مربوطة</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="press-ripple">
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "عروض نون النشطة", value: data?.stats.liveDeals ?? 0 },
            { label: "نقرات محوّلة", value: data?.stats.clicks ?? 0 },
            { label: "مبيعات مُسجّلة", value: data?.stats.conversions ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border px-2 py-3">
              <p className="text-lg font-bold text-primary">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">١) اختيار الحملة تلقائيًا</p>
          <div className="grid gap-2">
            {(data?.campaigns ?? []).map((c) => {
              const active = selected === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (selected !== c.id) {
                      recordEvent({
                        action: "noon_link_campaign",
                        campaignId: c.id,
                        campaignName: c.name,
                        network: c.network,
                        ...(selected ? { previousCampaignId: selected } : {}),
                        ...(publisherId.trim() ? { publisherId } : {}),
                        result: "اختيار حملة من لوحة الإعدادات",
                      });
                    }
                    setSelected(c.id);
                    try { localStorage.setItem(NOON_CHOICE_KEY, JSON.stringify({ campaignId: c.id, publisherId })); } catch { /* ignore */ }
                  }}
                  className={`text-right rounded-xl border p-3 transition ${active ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{c.name}</span>
                    <span className="flex items-center gap-1">
                      {c.id === data?.recommended && <Badge variant="secondary" className="text-[10px]">موصى بها</Badge>}
                      {active && <Check className="size-4 text-primary" />}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.note}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {c.network} · {c.market} · {c.model} {c.deepLink ? "· روابط عميقة ✓" : ""}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-semibold">٢) تأكيد Publisher ID</p>
          {data?.maskedPublisherId && (
            <p className="text-xs text-muted-foreground">
              المحفوظ حاليًا داخل التطبيق: <code dir="ltr">{data.maskedPublisherId}</code>
            </p>
          )}
          <div className="flex gap-2">
            <input
              value={publisherId}
              onChange={(e) => setPublisherId(e.target.value)}
              dir="ltr"
              placeholder={chosen?.idHint ?? "publisher id"}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <Button
              onClick={() => confirmMutation.mutate(publisherId)}
              disabled={confirmMutation.isPending || !publisherId.trim()}
              className="press-ripple"
            >
              {confirmMutation.isPending ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}
              تأكيد
            </Button>
          </div>
          {result && (
            <p className={`text-xs ${result.tone === "ok" ? "text-primary" : result.tone === "warn" ? "text-amber-500" : "text-destructive"}`}>
              {result.text}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            التأكيد يتحقق من الصيغة ويطابقها مع المعرّف المحفوظ دون كشفه، ويختار الحملة المناسبة تلقائيًا.
          </p>
        </div>

        {data?.sampleDeepLink && (
          <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
            <p className="text-xs font-semibold">معاينة الرابط العميق الفعلي</p>
            <code className="block text-[10px] break-all text-muted-foreground" dir="ltr">{data.sampleDeepLink}</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------- تخزين آمن ومشفّر للمفاتيح --------------------- */

const SECURE_KEY_FIELDS: Array<{ name: string; label: string; hint: string }> = [
  { name: "AMAZON_ACCESS_KEY", label: "أمازون — Access Key", hint: "من لوحة Amazon Associates / PA-API" },
  { name: "AMAZON_SECRET_KEY", label: "أمازون — Secret Key", hint: "يُعرض مرة واحدة فقط عند الإنشاء" },
  { name: "AMAZON_PARTNER_TAG", label: "أمازون — Partner Tag", hint: "مثال: hkeeem-21" },
  { name: "NOON_AFFILIATE_ID", label: "نون — Publisher ID", hint: "معرّف الناشر في حملة نون" },
];

function SecureKeysPanel() {
  const { user } = useAuth();
  const fetchKeys = useServerFn(getIntegrationKeysStatus);
  const saveKey = useServerFn(saveIntegrationKeyValue);
  const removeKey = useServerFn(removeIntegrationKeyValue);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["integration-keys-status"],
    queryFn: () => fetchKeys({}),
  });

  const save = useMutation({
    mutationFn: (vars: { name: string; value: string }) => saveKey({ data: vars }),
    onSuccess: (res, vars) => {
      if (!res?.ok) { toast.error(res?.reason ?? "تعذّر الحفظ"); return; }
      setDrafts((p) => ({ ...p, [vars.name]: "" }));
      toast.success("تم الحفظ مشفّرًا داخل قاعدة البيانات");
      refetch();
    },
    onError: () => toast.error("غير مصرّح — هذه الخطوة للمشرفين فقط"),
  });

  const remove = useMutation({
    mutationFn: (name: string) => removeKey({ data: { name } }),
    onSuccess: () => { toast.success("تم حذف المفتاح"); refetch(); },
    onError: () => toast.error("غير مصرّح — هذه الخطوة للمشرفين فقط"),
  });

  return (
    <Card className="hover-lift">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="size-5" /> تخزين آمن ومشفّر للمفاتيح
        </CardTitle>
        <Badge variant="secondary" className="gap-1"><Lock className="size-3" /> AES-256</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          تُشفَّر القيم قبل حفظها في قاعدة البيانات ولا يمكن استرجاعها من الواجهة أبدًا — تظهر الحالة فقط:
          «مفعّل» أو «غير مُضاف». تُستعمل القيم داخل الخادم فقط عند سحب العروض وتوليد روابط الشراء.
        </p>

        {SECURE_KEY_FIELDS.map((field) => {
          const row = data?.find((r) => r.name === field.name);
          const configured = Boolean(row?.configured);
          return (
            <div key={field.name} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{field.label}</div>
                  <div className="text-[11px] text-muted-foreground">{field.hint}</div>
                </div>
                {isLoading ? (
                  <span className="text-xs text-muted-foreground">جارٍ الفحص…</span>
                ) : configured ? (
                  <Badge className="gap-1"><Check className="size-3" /> مفعّل</Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <CircleDashed className="size-3" /> غير مُضاف
                  </Badge>
                )}
              </div>

              {user ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    placeholder={configured ? "أدخل قيمة جديدة للاستبدال" : "الصق القيمة هنا"}
                    aria-label={field.label}
                    value={drafts[field.name] ?? ""}
                    onChange={(e) => setDrafts((p) => ({ ...p, [field.name]: e.target.value }))}
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="press-ripple"
                      disabled={save.isPending || (drafts[field.name] ?? "").trim().length < 3}
                      onClick={() => save.mutate({ name: field.name, value: (drafts[field.name] ?? "").trim() })}
                    >
                      حفظ مشفّر
                    </Button>
                    {row?.storedInDatabase ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(field.name)}
                      >
                        حذف
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">سجّل الدخول بحساب مشرف لإدخال أو تحديث المفاتيح.</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
