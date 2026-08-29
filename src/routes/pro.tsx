import { createFileRoute, Link } from "@tanstack/react-router";
import { BellRing, Crown, GitCompareArrows, Palette, Percent, Sparkles } from "lucide-react";
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
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-hero p-8 md:p-14 text-center shadow-glow">
        <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative space-y-5">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/35 backdrop-blur border border-primary/50 text-sm font-bold">
            <Crown className="w-4 h-4 text-primary" />
            قريباً
          </span>
          <h1 className="font-thuluth text-4xl md:text-6xl leading-[1.6] drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            حكيم برو
          </h1>
          <p className="max-w-xl mx-auto text-base md:text-lg opacity-95 leading-loose">
            كل قوة الذكاء الاقتصادي في باقة واحدة — وفّر أكثر، أسرع، وبذكاء أعمق.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={notify}
              className="inline-flex items-center gap-2 bg-gradient-gold font-black px-8 py-3.5 rounded-2xl shadow-glow hover:opacity-95 transition"
            >
              <Sparkles className="w-5 h-5" />
              <span className="leading-normal">أعلمني عند الإطلاق</span>
            </button>
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/25 bg-black/30 backdrop-blur font-bold hover:bg-black/45 transition"
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

      <p className="text-center text-sm text-muted-foreground leading-relaxed">
        الباقة الأساسية في حكيم AI ستبقى مجانية دائماً — برو يضيف قوة إضافية لمن يريد أقصى توفير.
      </p>
    </main>
  );
}
