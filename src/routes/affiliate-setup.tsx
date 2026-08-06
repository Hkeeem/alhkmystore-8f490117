import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Check, CircleDashed, ExternalLink, KeyRound, Link2, RefreshCw, ShoppingCart, Copy, PlugZap, PlayCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getAffiliateKeyStatus, getSyncOverview, runExternalSyncNow } from "@/lib/affiliate-setup.functions";
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
      <header className="space-y-3">
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

      <ConversionsPanel />

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
            عندما تجهز أي مفتاح أخبرني في المحادثة وسأفتح نموذج إدخال آمن — لا ترسل المفاتيح كنص في الشات.
          </p>
        </CardContent>
      </Card>

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

  const { data: overview, refetch: refetchOverview, isFetching: overviewFetching } = useQuery({
    queryKey: ["external-sync-overview"],
    queryFn: () => fetchOverview({}),
  });

  const sync = useMutation({
    mutationFn: () => startSync({}),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`تم التحديث — ${res.upserted} عرضًا (أمازون ${res.sources.amazon} / نون ${res.sources.noon})`);
        refetchOverview();
      } else {
        toast.error("تعذّر تشغيل التحديث، حاول لاحقًا");
      }
    },
    onError: () => toast.error("غير مصرّح لك بتشغيل التحديث"),
  });

  const amazonReady = Boolean(status?.amazonAccessKey && status?.amazonSecretKey && status?.amazonPartnerTag);
  const noonReady = Boolean(status?.noonAffiliateId);
  const anyReady = amazonReady || noonReady;

  const sources = [
    {
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
          onClick={() => sync.mutate()}
        >
          {sync.isPending ? <RefreshCw className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
          {sync.isPending ? "جارٍ سحب العروض…" : "بدء التحديثات الآن"}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          التحديث التلقائي يعمل كل ٦ ساعات؛ هذا الزر لتشغيل دورة فورية.
        </p>
      </CardContent>
    </Card>
  );
}
