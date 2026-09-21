import { Search, Scale, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { stores } from "@/data/deals";
import { StoreLogo } from "./StoreLogo";

const steps = [
  {
    n: "1",
    icon: Search,
    title: "ابحث عن منتجك",
    desc: "اكتب اسم أي منتج",
  },
  {
    n: "2",
    icon: Scale,
    title: "قارن الأسعار",
    desc: "نشوف لك السعر في 65+ متجر لحظيًا",
  },
  {
    n: "3",
    icon: ShoppingBag,
    title: "اشترِ بأرخص سعر",
    desc: "نحوّلك مباشرة للمتجر الأرخص",
  },
];

export function HowItWorksSection() {
  const marqueeStores = [...stores, ...stores];

  return (
    <section className="space-y-6" aria-labelledby="how-it-works-title">
      <div className="text-center space-y-2">
        <h2
          id="how-it-works-title"
          className="font-thuluth text-2xl md:text-4xl leading-[1.7] text-foreground"
        >
          كيف يعمل حكيم؟
        </h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          ثلاث خطوات بس تدخلك أرخص سعر في السعودية
        </p>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.n}
              className="relative bg-card rounded-3xl border border-border/60 shadow-card p-5 flex items-start gap-4 hover:border-primary/40 transition"
            >
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow">
                  <Icon className="w-6 h-6 text-black" strokeWidth={2.2} />
                </div>
                <span
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-black flex items-center justify-center ring-4 ring-card"
                  aria-hidden="true"
                >
                  {s.n}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-base md:text-lg leading-snug text-foreground">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {s.desc}
                </p>
              </div>
              {i < steps.length - 1 && (
                <ArrowLeft
                  className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* شريط شعارات المتاجر المشمولة */}
      <div
        className="hkeeem-marquee relative overflow-hidden rounded-3xl border border-border/60 bg-card py-4"
        dir="ltr"
        aria-label="المتاجر المشمولة في المقارنة"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-card to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-card to-transparent z-10" />
        <div className="hkeeem-marquee-track flex items-center gap-8 w-max px-4">
          {marqueeStores.map((store, i) => (
            <div
              key={`${store.id}-${i}`}
              className="flex items-center gap-2.5 shrink-0"
            >
              <StoreLogo store={store} size="md" />
              <span className="text-sm font-bold text-foreground whitespace-nowrap">
                {store.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/stores"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary leading-normal hover:underline"
        >
          شوف كل المتاجر المشمولة ←
        </Link>
      </div>
    </section>
  );
}
