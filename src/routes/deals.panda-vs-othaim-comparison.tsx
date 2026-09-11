import { createFileRoute, Link } from "@tanstack/react-router";
import { deals, getStore, discountPercent } from "@/data/deals";
import { ArrowLeft, Flame, Scale, ShoppingBasket, TrendingDown } from "lucide-react";

const URL = "https://alhkmystore.lovable.app/deals/panda-vs-othaim-comparison";
const TITLE = "عروض بنده مقابل عروض العثيم — مقارنة أسبوعية";
const DESCRIPTION =
  "مقارنة أسبوعية بين عروض بنده وعروض العثيم على الأرز والزيت والحليب والدجاج — من الأرخص فعلاً هذا الأسبوع؟";

const FAQ = [
  {
    q: "من الأرخص هذا الأسبوع: بنده أم العثيم؟",
    a: "حسب العروض المسجّلة عندنا هذا الأسبوع، العثيم متقدّم في الأساسيات مثل الأرز والزيت والدجاج، بينما بنده أقوى في منتجات الألبان مثل حليب المراعي. الأفضل هو تقسيم قائمة التسوق بين المتجرين.",
  },
  {
    q: "متى تتحدث عروض بنده والعثيم؟",
    a: "عادةً تُطلق المتاجر السعودية عروضها الأسبوعية بين الأربعاء والخميس، ونحدّث المقارنة هنا مع كل تغيّر في الأسعار المسجّلة داخل حكيم AI.",
  },
  {
    q: "كيف أعرف السعر الأقل قبل ما أطلع من البيت؟",
    a: "افتح صفحة كل العروض واستخدم الترتيب الذكي حسب نسبة التوفير، أو اسأل مساعد حكيم AI مباشرة عن المنتج الذي تريده.",
  },
];

export const Route = createFileRoute("/deals/panda-vs-othaim-comparison")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: ComparisonPage,
});

function storeDeals(storeId: string) {
  return deals.filter((d) => d.storeId === storeId);
}

function ComparisonPage() {
  const panda = getStore("panda");
  const othaim = getStore("othaim");
  const pandaDeals = storeDeals("panda");
  const othaimDeals = storeDeals("othaim");

  // نفس المنتج في المتجرين (مقارنة مباشرة)
  const keys = Array.from(
    new Set(pandaDeals.map((d) => d.productKey).filter(Boolean) as string[]),
  ).filter((k) => othaimDeals.some((d) => d.productKey === k));

  const headToHead = keys.map((k) => {
    const p = pandaDeals.find((d) => d.productKey === k)!;
    const o = othaimDeals.find((d) => d.productKey === k)!;
    return {
      key: k,
      panda: p,
      othaim: o,
      winner: p.price === o.price ? "tie" : p.price < o.price ? "panda" : "othaim",
    };
  });

  const avg = (arr: typeof deals) =>
    arr.length ? Math.round(arr.reduce((s, d) => s + discountPercent(d), 0) / arr.length) : 0;

  const pandaAvg = avg(pandaDeals);
  const othaimAvg = avg(othaimDeals);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12 space-y-8">
      <nav className="text-xs text-muted-foreground flex items-center gap-2">
        <Link to="/" className="hover:text-primary">
          الرئيسية
        </Link>
        <span>/</span>
        <Link to="/deals" className="hover:text-primary">
          العروض
        </Link>
        <span>/</span>
        <span>بنده مقابل العثيم</span>
      </nav>

      <header className="rounded-3xl bg-gradient-hero p-6 md:p-8 text-primary-foreground shadow-glow space-y-3">
        <div className="flex items-center gap-2 text-xs opacity-90">
          <Scale className="w-4 h-4" />
          <span>مقارنة أسبوعية</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-black leading-tight">
          عروض بنده مقابل عروض العثيم: مين الأوفر هذا الأسبوع؟
        </h1>
        <p className="text-sm md:text-base opacity-90 max-w-2xl">{DESCRIPTION}</p>
      </header>

      <section className="grid grid-cols-2 gap-4">
        {[
          { store: panda, avgOff: pandaAvg, count: pandaDeals.length },
          { store: othaim, avgOff: othaimAvg, count: othaimDeals.length },
        ].map(({ store, avgOff, count }) => (
          <div
            key={store?.id}
            className="rounded-3xl border border-border/60 bg-card p-5 space-y-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-white"
                style={{ background: store?.color }}
                aria-hidden="true"
              >
                {store?.logo}
              </span>
              <h2 className="font-black">{store?.name}</h2>
            </div>
            <div className="text-3xl font-black tabular-nums text-primary">{avgOff}٪</div>
            <div className="text-xs text-muted-foreground">متوسط التوفير على {count} عرض مسجّل</div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black flex items-center gap-2">
          <ShoppingBasket className="w-5 h-5 text-primary" />
          مقارنة مباشرة على الأساسيات
        </h2>
        <div className="overflow-x-auto rounded-3xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <caption className="sr-only">مقارنة أسعار نفس المنتج بين بنده والعثيم</caption>
            <thead className="bg-muted/40 text-xs">
              <tr>
                <th scope="col" className="text-right p-3 font-black">
                  المنتج
                </th>
                <th scope="col" className="text-right p-3 font-black">
                  بنده
                </th>
                <th scope="col" className="text-right p-3 font-black">
                  العثيم
                </th>
                <th scope="col" className="text-right p-3 font-black">
                  الأوفر
                </th>
              </tr>
            </thead>
            <tbody>
              {headToHead.map((row) => (
                <tr key={row.key} className="border-t border-border/50">
                  <th scope="row" className="p-3 text-right font-bold">
                    {row.panda.title}
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {row.panda.unit}
                    </span>
                  </th>
                  <td className="p-3 tabular-nums">{row.panda.price} ر.س</td>
                  <td className="p-3 tabular-nums">{row.othaim.price} ر.س</td>
                  <td className="p-3 font-black text-primary">
                    {row.winner === "tie"
                      ? "متعادل"
                      : row.winner === "panda"
                        ? `بنده (−${row.othaim.price - row.panda.price} ر.س)`
                        : `العثيم (−${row.panda.price - row.othaim.price} ر.س)`}
                  </td>
                </tr>
              ))}
              {headToHead.length === 0 && (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={4}>
                    لا توجد منتجات متطابقة بين المتجرين حالياً — تابع صفحة العروض للتحديثات.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          الأسعار مأخوذة من العروض المسجّلة داخل حكيم AI وقد تختلف حسب الفرع وتاريخ انتهاء العرض.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {[
          { store: panda, list: pandaDeals },
          { store: othaim, list: othaimDeals },
        ].map(({ store, list }) => (
          <div
            key={store?.id}
            className="rounded-3xl border border-border/60 bg-card p-5 space-y-3"
          >
            <h2 className="font-black flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              أبرز عروض {store?.name}
            </h2>
            <ul className="space-y-2">
              {list.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <Link
                    to="/deals/$id"
                    params={{ id: d.id }}
                    className="flex items-center justify-between gap-3 rounded-2xl p-3 hover:bg-muted/50 transition"
                  >
                    <span className="text-sm font-bold">{d.title}</span>
                    <span className="text-xs tabular-nums text-primary font-black">
                      {d.price} ر.س · −{discountPercent(d)}٪
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-5 space-y-3">
        <h2 className="text-xl font-black flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-primary" />
          الخلاصة: كيف توفّر أكثر؟
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pr-5">
          <li>قسّم قائمتك: الأساسيات (أرز، زيت، دجاج) من المتجر الأقل سعراً في الجدول أعلاه.</li>
          <li>راجع تواريخ انتهاء العروض — أغلب العروض الأسبوعية تنتهي خلال 3 إلى 7 أيام.</li>
          <li>استخدم قائمة التسوق الذكية في حكيم AI لتوزيع مشترياتك تلقائياً على المتجر الأوفر.</li>
        </ul>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/deals"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-hero text-primary-foreground px-4 py-2.5 text-sm font-black shadow-glow"
          >
            كل العروض <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            to="/smart-list"
            className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-sm font-black hover:bg-muted/50 transition"
          >
            قائمة التسوق الذكية
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black">أسئلة شائعة</h2>
        {FAQ.map((f) => (
          <div key={f.q} className="rounded-3xl border border-border/60 bg-card p-5">
            <h3 className="font-black mb-1">{f.q}</h3>
            <p className="text-sm text-muted-foreground">{f.a}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
