import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bot, Check, ChevronLeft, Home, MapPin, RotateCcw, Save, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/property-bot")({
  head: () => ({
    meta: [
      { title: "بوت إدخال العقارات — Hkeeem AI" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PropertyBotPage,
});

type Step = "title" | "purpose" | "city" | "district" | "type" | "price" | "bedrooms" | "features" | "services" | "review";
type Form = {
  title: string;
  purpose: "شراء" | "إيجار";
  city: string;
  district: string;
  property_type: string;
  price: string;
  bedrooms: string;
  features: string;
  required_services: string;
};

const initialForm: Form = {
  title: "",
  purpose: "شراء",
  city: "",
  district: "",
  property_type: "",
  price: "",
  bedrooms: "",
  features: "",
  required_services: "",
};

const questions: Record<Exclude<Step, "review">, string> = {
  title: "ما عنوان الإعلان؟ مثال: شقة عائلية بإطلالة جميلة",
  purpose: "هل العقار للبيع أم للإيجار؟ اكتب: شراء أو إيجار",
  city: "في أي مدينة يقع العقار؟",
  district: "ما الحي أو المنطقة؟",
  type: "ما نوع العقار؟ مثال: شقة، فيلا، أرض، مكتب",
  price: "ما السعر بالريال السعودي؟",
  bedrooms: "كم عدد غرف النوم؟ اكتب 0 إذا لم ينطبق",
  features: "ما أبرز المميزات؟ افصل بينها بفاصلة، أو اكتب لا يوجد",
  services: "ما الخدمات المطلوبة أو المتوفرة؟ افصل بينها بفاصلة، أو اكتب لا يوجد",
};

const steps: Exclude<Step, "review">[] = [
  "title",
  "purpose",
  "city",
  "district",
  "type",
  "price",
  "bedrooms",
  "features",
  "services",
];

function splitList(value: string) {
  return value
    .split(/[،,]/)
    .map((item) => item.trim())
    .filter((item) => item && item !== "لا يوجد");
}

function PropertyBotPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Form>(initialForm);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const currentStep: Step = stepIndex >= steps.length ? "review" : steps[stepIndex];

  const progress = Math.round((Math.min(stepIndex, steps.length) / steps.length) * 100);
  const currentQuestion = currentStep === "review" ? "راجِع البيانات التالية قبل حفظ الإعلان كمسودة." : questions[currentStep];

  const summary = useMemo(
    () => [
      ["العنوان", form.title],
      ["الغرض", form.purpose],
      ["الموقع", `${form.city} — ${form.district}`],
      ["النوع", form.property_type],
      ["السعر", `${Number(form.price || 0).toLocaleString("ar-SA")} ر.س`],
      ["غرف النوم", form.bedrooms],
      ["المميزات", form.features || "لا يوجد"],
      ["الخدمات", form.required_services || "لا يوجد"],
    ],
    [form],
  );

  function reset() {
    setForm(initialForm);
    setStepIndex(0);
    setInput("");
  }

  function next() {
    const value = input.trim();
    if (!value) {
      toast.error("اكتب إجابة قبل المتابعة");
      return;
    }
    if (currentStep === "purpose" && !["شراء", "إيجار", "بيع"].includes(value)) {
      toast.error("اكتب شراء أو إيجار");
      return;
    }
    if (["price", "bedrooms"].includes(currentStep) && (!/^\d+(\.\d+)?$/.test(value) || Number(value) < 0)) {
      toast.error("أدخل رقمًا صحيحًا فقط");
      return;
    }
    const key = currentStep === "type" ? "property_type" : currentStep === "services" ? "required_services" : currentStep;
    setForm((old) => ({ ...old, [key]: currentStep === "purpose" ? (value === "بيع" ? "شراء" : value) : value }));
    setInput("");
    setStepIndex((index) => index + 1);
  }

  async function saveDraft() {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولًا");
      return;
    }
    const price = Number(form.price);
    const bedrooms = Number(form.bedrooms);
    if (!form.title || !form.city || !form.district || !form.property_type || !price || Number.isNaN(bedrooms)) {
      toast.error("أكمل بيانات العقار قبل الحفظ");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("property_listings").insert({
      owner_id: user.id,
      title: form.title,
      purpose: form.purpose,
      city: form.city,
      district: form.district,
      property_type: form.property_type,
      price,
      bedrooms,
      features: splitList(form.features),
      required_services: splitList(form.required_services),
      status: "draft",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message || "تعذر حفظ الإعلان");
      return;
    }
    toast.success("تم حفظ العقار كمسودة للمراجعة");
    reset();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-background px-4 py-6 pb-24">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-hero text-primary shadow-glow">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black">بوت إدخال العقارات</h1>
              <p className="text-sm text-muted-foreground">أجب عن الأسئلة وسأجهز الإعلان لك</p>
            </div>
          </div>
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary" type="button">
            <RotateCcw className="h-4 w-4" /> إعادة
          </button>
        </header>

        <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-label={`التقدم ${progress}%`}>
          <div className="h-full rounded-full bg-gradient-gold transition-all" style={{ width: `${Math.max(progress, 5)}%` }} />
        </div>

        <section className="rounded-3xl border border-primary/20 bg-card p-5 shadow-card md:p-7">
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-secondary/70 p-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="font-medium leading-relaxed">{currentQuestion}</p>
          </div>

          {currentStep !== "review" ? (
            <form onSubmit={(event) => { event.preventDefault(); next(); }} className="space-y-4">
              {currentStep === "purpose" ? (
                <div className="grid grid-cols-2 gap-3">
                  {["شراء", "إيجار"].map((value) => (
                    <button key={value} type="button" onClick={() => setInput(value)} className={`rounded-2xl border p-4 font-bold transition ${input === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                      {value}
                    </button>
                  ))}
                </div>
              ) : (
                <input autoFocus value={input} onChange={(event) => setInput(event.target.value)} inputMode={currentStep === "price" || currentStep === "bedrooms" ? "numeric" : "text"} placeholder="اكتب إجابتك هنا" className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              )}
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-gold px-5 py-3 font-bold text-secondary shadow-glow hover:opacity-95">
                <Send className="h-4 w-4" /> متابعة
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {summary.map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-border/70 bg-secondary/40 p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button disabled={saving} onClick={saveDraft} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-gold px-5 py-3 font-bold text-secondary disabled:opacity-60">
                  <Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ كمسودة"}
                </button>
                <button onClick={() => setStepIndex(0)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3 font-bold hover:bg-secondary">
                  <ChevronLeft className="h-4 w-4" /> تعديل البيانات
                </button>
              </div>
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-4 w-4 text-green-500" /> لن يظهر الإعلان للعامة قبل المراجعة والاعتماد.</p>
            </div>
          )}
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4"><Home className="mb-2 h-5 w-5 text-primary" /><p className="text-sm font-bold">إدخال منظم</p><p className="text-xs text-muted-foreground">أسئلة قصيرة بدل نموذج طويل</p></div>
          <div className="rounded-2xl border border-border bg-card p-4"><MapPin className="mb-2 h-5 w-5 text-primary" /><p className="text-sm font-bold">موقع دقيق</p><p className="text-xs text-muted-foreground">مدينة وحي لكل إعلان</p></div>
          <div className="rounded-2xl border border-border bg-card p-4"><Check className="mb-2 h-5 w-5 text-primary" /><p className="text-sm font-bold">مراجعة آمنة</p><p className="text-xs text-muted-foreground">يحفظ كمسودة أولًا</p></div>
        </div>
      </div>
    </main>
  );
}

// Keep the route file discoverable in the generated route tree.
export type PropertyBotStep = Step;
