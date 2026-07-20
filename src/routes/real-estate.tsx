import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, TrendingUp, MapPin, Sparkles } from "lucide-react";

export const Route = createFileRoute("/real-estate")({
  head: () => ({
    meta: [
      { title: "العقارات — Hkeeem AI" },
      { name: "description", content: "تحليل عقاري ذكي، مقارنة أسعار الفلل والشقق، وتوقعات السوق العقاري السعودي بالذكاء الاصطناعي." },
    ],
  }),
  component: RealEstate,
});

function RealEstate() {
  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-8 md:p-12 text-primary-foreground shadow-glow">
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> قريباً
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-black">الذكاء العقاري</h1>
          <p className="mt-3 max-w-lg text-white/80">مقارنة أسعار العقارات، تحليل الأحياء، وتوقع أفضل وقت للشراء بالذكاء الاصطناعي.</p>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: Home, t: "مقارنة العقارات", d: "فلل، شقق، أراضٍ عبر المنصات الرئيسية" },
          { icon: TrendingUp, t: "توقع الأسعار", d: "اتجاه السوق لكل حي بالذكاء الاصطناعي" },
          { icon: MapPin, t: "خرائط الأحياء", d: "الخدمات، المدارس، والقيمة السوقية" },
        ].map((f) => (
          <div key={f.t} className="p-6 rounded-3xl bg-card border border-border/60 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center mb-3">
              <f.icon className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-black text-lg">{f.t}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link to="/" className="inline-block px-6 py-3 rounded-2xl bg-secondary text-secondary-foreground font-bold">رجوع للرئيسية</Link>
      </div>
    </main>
  );
}
