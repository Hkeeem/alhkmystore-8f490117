import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Check, Palette, RotateCcw, Square, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import {
  useAppearance,
  ACCENT_PRESETS,
  CARD_STYLES,
  type CardStyle,
} from "@/hooks/use-appearance";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "الإعدادات وتخصيص المظهر | HkeeemAI" },
      {
        name: "description",
        content:
          "خصّص لون الثيم وشكل البطاقات وانحناء الزوايا في HkeeemAI، مع معاينة فورية لمظهر بطاقات العروض.",
      },
      { property: "og:title", content: "تخصيص المظهر | HkeeemAI" },
      {
        property: "og:description",
        content: "غيّر لون التمييز وشكل بطاقات العروض بسهولة داخل إعدادات HkeeemAI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SettingsPage() {
  const { theme, setTheme, auto, setAuto, themes } = useTheme();
  const { appearance, update, reset, preview, restore } = useAppearance();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" />
          تخصيص المظهر
        </h1>
        <p className="text-muted-foreground text-sm">
          اختر لون التمييز وشكل البطاقات وانحناء الزوايا — التغيير يظهر فورًا ويُحفظ على جهازك.
        </p>
        <Link
          to="/notifications"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2 text-sm font-bold transition-colors hover:bg-muted hover:text-primary"
        >
          <Bell className="w-4 h-4 text-primary" />
          إعدادات الإشعارات
        </Link>
      </header>

      {/* نمط الثيم المعدني */}
      <section aria-labelledby="theme-h" className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 id="theme-h" className="font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          نمط الثيم
        </h2>
        <div className="flex flex-wrap gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                toast.success(`تم حفظ ${t.label}`);
              }}
              aria-pressed={!auto && theme === t.id}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                !auto && theme === t.id
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="w-5 h-5 rounded-full" style={{ backgroundImage: t.swatch }} />
              {t.label}
            </button>
          ))}
          <button
            onClick={() => {
              setAuto(!auto);
              toast.success(auto ? "تم إيقاف الوضع التلقائي" : "تم تفعيل الوضع التلقائي");
            }}
            aria-pressed={auto}
            className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
              auto ? "border-primary ring-2 ring-primary/40 text-primary" : "border-border hover:border-primary/50"
            }`}
          >
            تلقائي حسب النظام
          </button>
        </div>
      </section>

      {/* لون التمييز */}
      <section aria-labelledby="accent-h" className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 id="accent-h" className="font-bold">لون التمييز</h2>
        <div className="flex flex-wrap gap-3">
          {ACCENT_PRESETS.map((p) => {
            const active = appearance.accent === p.hex;
            return (
              <button
                key={p.id}
                onClick={() => {
                  update({ accent: p.hex });
                  toast.success(`تم تطبيق ${p.label}`);
                }}
                onMouseEnter={() => preview({ accent: p.hex })}
                onFocus={() => preview({ accent: p.hex })}
                onMouseLeave={restore}
                onBlur={restore}
                aria-pressed={active}
                title={p.label}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                  active ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full border border-border"
                  style={{ background: p.hex || "var(--primary)" }}
                />
                {p.label}
                {active && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-3 text-sm font-bold">
          لون مخصص
          <input
            type="color"
            value={appearance.accent || "#D4AF37"}
            onChange={(e) => update({ accent: e.target.value })}
            className="h-9 w-14 cursor-pointer rounded-lg border border-border bg-transparent"
            aria-label="اختيار لون تمييز مخصص"
          />
        </label>
      </section>

      {/* شكل البطاقة */}
      <section aria-labelledby="cards-h" className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 id="cards-h" className="font-bold flex items-center gap-2">
          <Square className="w-4 h-4 text-primary" />
          شكل البطاقات
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CARD_STYLES.map((s) => {
            const active = appearance.cardStyle === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  update({ cardStyle: s.id as CardStyle });
                  toast.success(`تم تطبيق البطاقة ${s.label}`);
                }}
                onMouseEnter={() => preview({ cardStyle: s.id })}
                onFocus={() => preview({ cardStyle: s.id })}
                onMouseLeave={restore}
                onBlur={restore}
                aria-pressed={active}
                className={`rounded-xl border p-3 text-right transition ${
                  active ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
                }`}
              >
                <span className="block text-sm font-bold">{s.label}</span>
                <span className="block text-[11px] text-muted-foreground mt-1">{s.hint}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <label htmlFor="radius" className="text-sm font-bold">
            انحناء الزوايا: {appearance.radius}px
          </label>
          <input
            id="radius"
            type="range"
            min={0}
            max={32}
            step={2}
            value={appearance.radius}
            onChange={(e) => update({ radius: Number(e.target.value) })}
            className="w-full accent-[var(--primary)]"
          />
        </div>

        <button
          onClick={() => {
            reset();
            toast.success("تمت استعادة المظهر الافتراضي");
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-bold hover:border-primary/50 transition"
        >
          <RotateCcw className="w-4 h-4" />
          استعادة الافتراضي
        </button>
      </section>

      {/* معاينة حية */}
      <section aria-labelledby="preview-h" className="space-y-3">
        <h2 id="preview-h" className="font-bold">معاينة البطاقات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { t: "زيت زيتون بكر ممتاز", s: "متجر موثّق", p: 29, o: 45 },
            { t: "أرز بسمتي 5 كجم", s: "متجر موثّق", p: 54, o: 72 },
            { t: "قهوة مختصة 250 جم", s: "متجر موثّق", p: 39, o: 60 },
          ].map((d) => (
            <article key={d.t} className="hk-card overflow-hidden">
              <div className="aspect-[4/3] bg-primary/10 grid place-items-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-bold text-[15px] text-zinc-900">{d.t}</h3>
                <p className="text-xs text-zinc-500">{d.s}</p>
                <p className="font-black text-lg text-zinc-900">
                  {d.p} ر.س
                  <span className="ms-2 text-xs font-normal text-zinc-400 line-through">{d.o}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
