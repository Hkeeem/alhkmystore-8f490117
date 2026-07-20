import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Navigation, Store, Sparkles } from "lucide-react";

export const Route = createFileRoute("/maps")({
  head: () => ({
    meta: [
      { title: "الخرائط — Hkeeem AI" },
      { name: "description", content: "خريطة تفاعلية لأفضل العروض والمتاجر القريبة منك في المملكة العربية السعودية." },
    ],
  }),
  component: Maps,
});

function Maps() {
  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-8 md:p-12 text-primary-foreground shadow-glow">
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> قريباً
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-black">الخرائط الذكية</h1>
          <p className="mt-3 max-w-lg text-white/80">اكتشف أقرب المتاجر والعروض على خريطة تفاعلية مربوطة بجوجل مابس.</p>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: MapPin, t: "أقرب المتاجر", d: "بحسب موقعك الحالي" },
          { icon: Navigation, t: "أفضل مسار", d: "لجولة توفير كاملة في يوم واحد" },
          { icon: Store, t: "فروع فعّالة", d: "ساعات العمل والعروض النشطة" },
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
