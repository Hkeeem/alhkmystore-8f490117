import { createFileRoute, Link } from "@tanstack/react-router";
import { AIStackSection } from "@/components/AIStackSection";

import {
  Sparkles,
  Ticket,
  TrendingDown,
  Store as StoreIcon,
  Bot,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — حكيم AI" },
      {
        name: "description",
        content:
          "التسوق الذكي جمعنا المتاجر في حكيم AI، مدعومة بالذكاء الاصطناعي. أقوى العروض والكوبونات ومقارنة الأسعار في مكان واحد.",
      },
      { property: "og:title", content: "من نحن — حكيم AI" },
      {
        property: "og:description",
        content:
          "التسوق الذكي جمعنا المتاجر في حكيم AI، مدعومة بالذكاء الاصطناعي. أقوى العروض والكوبونات ومقارنة الأسعار في مكان واحد.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alhkmystore.lovable.app/about" },
    ],
    links: [{ rel: "canonical", href: "https://alhkmystore.lovable.app/about" }],
  }),
  component: AboutPage,
});

const highlights: { icon: LucideIcon; title: string; note: string; tone: string }[] = [
  {
    icon: StoreIcon,
    title: "جمعنا المتاجر",
    note: "كل متاجرك المفضلة في مكان واحد — تسوق ذكي بلا تنقل بين التطبيقات.",
    tone: "from-primary/25 to-primary/5",
  },
  {
    icon: Sparkles,
    title: "مدعومة بالذكاء الاصطناعي",
    note: "الذكاء الاصطناعي يرتب العروض ويرشّح لك الأفضل أولاً.",
    tone: "from-accent/25 to-accent/5",
  },
  {
    icon: Ticket,
    title: "أقوى العروض والكوبونات",
    note: "أحدث العروض الحقيقية وأكواد الخصم الفعّالة من المتاجر الشريكة.",
    tone: "from-primary/25 to-primary/5",
  },
  {
    icon: TrendingDown,
    title: "مقارنة الأسعار فلا تحتار",
    note: "قارن السعر قبل ما تشتري ووفّر من أول نقرة.",
    tone: "from-accent/25 to-accent/5",
  },
];

function AboutPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen pb-24" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/20 via-background to-background">
        <div className="max-w-3xl mx-auto px-4 pt-14 pb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary rounded-full px-4 py-1.5 text-xs font-bold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>حكيم AI | الذكاء الاقتصادية</span>
          </div>
          <h1 className="font-display font-black text-3xl md:text-5xl leading-tight text-foreground">
            التسوق الذكي جمعنا المتاجر في{" "}
            <span className="text-primary">حكيم AI</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            مدعومة بالذكاء الاصطناعي — أقوى العروض والكوبونات،
            <br className="hidden md:block" />
            وأما مقارنة الأسعار فلا تحتار.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm rounded-full px-6 py-3 shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
            >
              تصفّح العروض
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 bg-card border border-border font-bold text-sm rounded-full px-6 py-3 hover:bg-muted/50 transition-colors"
            >
              <Bot className="w-4 h-4 text-primary" />
              اسأل الحكيم
            </Link>
          </div>
        </div>
      </section>

      {/* ماذا نقدم */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="font-black text-2xl md:text-3xl text-foreground mb-2 text-center">
          لماذا حكيم AI؟
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          أربع نقاط تختصر رحلة التسوق الذكي
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 backdrop-blur"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-bl ${h.tone} pointer-events-none`}
              />
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-3">
                  <h.icon className="w-5 h-5 text-primary" strokeWidth={2.2} />
                </div>
                <h3 className="font-black text-lg text-foreground">{h.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{h.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* أدوات الذكاء الاصطناعي التي بُني بها المشروع */}
      <LazySection minHeight={140}>
        <AIStackSection className="pb-16" />
      </LazySection>
    </main>
  );
}
