import { createFileRoute, Link } from "@tanstack/react-router";
import { BellRing, Crown, GitCompareArrows, Palette, Percent, Sparkles, Store, Map, Tag } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/pro")({
  head: () => ({
    meta: [
      { title: "حكيم برو — الذكاء الاقتصادي بلا حدود | HkeeemAI" },
      { name: "description", content: "حكيم برو: تنبيهات انخفاض الأسعار الفورية، كاش باك وعروض حصرية، مقارنات وتحليلات متقدمة، وشارة وثيمات خاصة — قريباً." },
      { property: "og:title", content: "حكيم برو — الذكاء الاقتصادي بلا حدود" },
      { property: "og:description", content: "تنبيهات انخفاض السعر، كاش باك وعروض حصرية، تحليلات متقدمة، وثيمات خاصة — قريباً على HkeeemAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProPage,
});

const FEATURES = [
  {
    icon: BellRing,
    title: "تنبيهات انخفاض السعر",
    desc: "رصد لحظي لأي منتج تتابعه — يوصلك تنبيه فور هبوط السعر قبل الجميع.",
  },
  {
    icon: Percent,
    title: "كاش باك وعروض حصرية",
    desc: "نسب استرداد أعلى وعروض مخصصة للمشتركين فقط من المتاجر الشريكة.",
  },
  {
    icon: GitCompareArrows,
    title: "مقارنات وتحليلات متقدمة",
    desc: "مقارنات غير محدودة بين المتاجر مع تحليل ذكاء اصطناعي أعمق لتاريخ الأسعار.",
  },
  {
    icon: Palette,
    title: "شارة برو وثيمات خاصة",
    desc: "شارة ذهبية مميزة على حسابك وثيمات حصرية وتجربة أنقى بلا تشتيت.",
  },
] as const;

function ProPage() {
  const notify = () => {
    trackEvent("pro_interest", { source: "pro_page_cta" });
    toast.success("تم تسجيل اهتمامك ✨ سنُعلمك فور إطلاق حكيم برو");
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-platinum p-8 md:p-14 text-center shadow-platinum">
        <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative space-y-5">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/35 backdrop-blur border border-white/40 text-sm font-bold">
            <Crown className="w-4 h-4 text-platinum-shine" />
            قريباً
          </span>
          <h1 className="font-thuluth text-4xl md:text-6xl leading-[1.6] text-platinum-shine drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            حكيم برو
          </h1>
          <p className="max-w-xl mx-auto text-base md:text-lg opacity-95 leading-loose">
            كل قوة الذكاء الاقتصادي في باقة واحدة — وفّر أكثر، أسرع، وبذكاء أعمق.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={notify}
              className="inline-flex items-center gap-2 bg-platinum-shine font-black px-8 py-3.5 rounded-2xl shadow-platinum hover:opacity-95 transition"
            >
              <Sparkles className="w-5 h-5" />
              <span className="leading-normal">أعلمني عند الإطلاق</span>
            </button>
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/30 bg-black/30 backdrop-blur font-bold hover:bg-black/45 transition"
            >
              تصفح العروض المجانية
            </Link>
          </div>
        </div>
      </section>

      {/* المميزات */}
      <section aria-labelledby="pro-features">
        <h2 id="pro-features" className="font-black text-2xl md:text-3xl leading-snug mb-6 text-center">
          ماذا تحصل مع برو؟
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="hk-card p-6 space-y-3 hover:-translate-y-0.5 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/12 text-primary flex items-center justify-center ring-1 ring-primary/30">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg leading-snug">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* بوابة التاجر */}
      <section aria-labelledby="pro-merchant" className="hk-card p-6 md:p-8 space-y-5 border-primary/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/12 text-primary flex items-center justify-center ring-1 ring-primary/30">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 id="pro-merchant" className="font-black text-xl">بوابة التاجر</h2>
            <p className="text-sm text-muted-foreground">أضف عروضك وكوبوناتك ووثّق حسابك للظهور في الخريطة.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-muted/40 space-y-2">
            <Tag className="w-5 h-5 text-primary" />
            <p className="font-bold text-sm">كوبونات حصرية</p>
            <p className="text-xs text-muted-foreground">أكواد خصم تظهر أولاً للمشتركين.</p>
          </div>
          <div className="p-4 rounded-2xl bg-muted/40 space-y-2">
            <BellRing className="w-5 h-5 text-primary" />
            <p className="font-bold text-sm">تنبيهات مبكرة</p>
            <p className="text-xs text-muted-foreground">إشعار فوري قبل انتهاء العرض بـ24 ساعة.</p>
          </div>
          <div className="p-4 rounded-2xl bg-muted/40 space-y-2">
            <Map className="w-5 h-5 text-primary" />
            <p className="font-bold text-sm">ظهور أقوى على الخريطة</p>
            <p className="text-xs text-muted-foreground">علامة مميزة وإحداثيات دقيقة لمتجرك.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <Link
            to="/merchant"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl hover:opacity-95 transition w-full sm:w-auto justify-center"
          >
            <Store className="w-5 h-5" />
            دخول بوابة التاجر
          </Link>
          <Link
            to="/deals-admin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-primary/30 bg-primary/5 font-bold hover:bg-primary/10 transition w-full sm:w-auto justify-center"
          >
            <Sparkles className="w-5 h-5" />
            لوحة إدارة العروض
          </Link>
        </div>
      </section>

      <p className="text-center text-sm text-muted-foreground leading-relaxed">
        الباقة الأساسية في حكيم AI ستبقى مجانية دائماً — برو يضيف قوة إضافية لمن يريد أقصى توفير.
      </p>
    </main>
  );
}
