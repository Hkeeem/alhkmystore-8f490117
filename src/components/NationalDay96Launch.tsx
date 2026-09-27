
// File: src/components/NationalDay96Launch.tsx
// الصقه في مشروع Lovable - alhkmystore.lovable.app
// يدعم Tailwind - لا يحتاج مكتبات اضافية

import { useEffect, useState } from "react";

export default function NationalDay96Launch() {
  const [timeLeft, setTimeLeft] = useState({ h: 96, m: 0, s: 0 });
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const end = Date.now() + 96 * 60 * 60 * 1000;
    const i = setInterval(() => {
      const d = Math.max(0, end - Date.now());
      setTimeLeft({
        h: Math.floor(d / 3600000),
        m: Math.floor((d % 3600000) / 60000),
        s: Math.floor((d % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(i);
  }, []);

  const copy = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#0f0a2a] text-white font-[Tajawal] selection:bg-[#d4af37]/30">
      {/* Banner Top */}
      <div className="w-full bg-gradient-to-r from-[#1a5c2a] via-[#0f0a2a] to-[#d4af37] text-center py-2 text-[12px] tracking-wide">
        🇸🇦 الافتتاح الكبير - اليوم الوطني 96 - عز وعزوة - 96 ساعة فقط - كود <b>KSA96</b>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-16 text-center">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,#d4af37,transparent_60%)]" />
        <h1 className="relative text-[56px] md:text-[96px] font-black leading-none">
          <span className="text-[#d4af37]">96</span>
        </h1>
        <h2 className="relative mt-4 text-3xl md:text-5xl font-black">
          اليوم الوطني السعودي <span className="text-[#d4af37]">عز وعزوة</span>
        </h2>
        <p className="relative mt-4 text-white/70 max-w-2xl mx-auto">
          من حكيم AI إلى Alhkmy.store - نفتتح منصتنا الذكية احتفالاً بالوطن. 96 ساعة عروض مجنونة.
        </p>

        {/* Countdown */}
        <div className="relative mt-8 flex justify-center gap-3">
          {[
            { l: "ساعة", v: timeLeft.h },
            { l: "دقيقة", v: timeLeft.m },
            { l: "ثانية", v: timeLeft.s },
          ].map((t) => (
            <div key={t.l} className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 min-w-[80px]">
              <div className="text-2xl font-black text-[#d4af37]">{String(t.v).padStart(2, "0")}</div>
              <div className="text-[11px] opacity-60">{t.l}</div>
            </div>
          ))}
        </div>

        <div className="relative mt-8 flex justify-center gap-3">
          <button
            onClick={() => copy("KSA96", "hero")}
            className="rounded-full bg-[#d4af37] text-black px-8 py-3 font-bold hover:bg-[#f7e39c] transition"
          >
            {copied === "hero" ? "تم النسخ ✓" : "انسخ كود KSA96 - خصم 30%"}
          </button>
          <a href="https://alhkmy.store" className="rounded-full border border-white/20 px-8 py-3 font-bold hover:bg-white hover:text-black transition">
            تسوق الآن
          </a>
        </div>
      </section>

      {/* Offers */}
      <section className="mx-auto max-w-6xl px-6 grid md:grid-cols-4 gap-4 pb-16">
        {[
          { t: "عرض 96 ريال", d: "20 منتج بـ 96 ريال فقط", c: "96SAR" },
          { t: "فلاش 96%", d: "منتج كل 6 ساعات بخصم 96%", c: "FLASH96" },
          { t: "خصم عام 30%", d: "على كل المتجر", c: "KSA96" },
          { t: "شحن مجاني", d: "+ هدية العلم", c: "FREE96" },
        ].map((o) => (
          <div key={o.c} className="rounded-2xl bg-[#14102f] border border-[#d4af37]/20 p-5">
            <div className="text-[#d4af37] font-black">{o.t}</div>
            <div className="text-sm opacity-70 mt-1">{o.d}</div>
            <button onClick={() => copy(o.c, o.c)} className="mt-3 w-full rounded-full bg-white/10 py-2 text-xs font-bold">
              {copied === o.c ? "تم ✓" : `انسخ ${o.c}`}
            </button>
          </div>
        ))}
      </section>

      {/* Salla HTML Instructions */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl bg-black/40 border border-white/10 p-6">
          <h3 className="font-bold">كود سلة - الصقه في تخصيص المتجر - HTML مخصص</h3>
          <p className="text-xs opacity-60 mt-2">روح سلة > تصميم المتجر > CSS/JS مخصص > الصق هذا الكود في الهيدر</p>
          <pre className="mt-4 bg-[#0f0a2a] p-4 rounded-xl text-[11px] overflow-auto ltr">
{`<div id="ksa96-bar" style="background:linear-gradient(90deg,#1a5c2a,#d4af37);color:#fff;text-align:center;padding:10px;font-weight:bold">
🇸🇦 افتتاح Alhkmy.store - 96 ساعة - كود KSA96 خصم 30%
</div>`}
          </pre>
        </div>
      </section>
    </div>
  );
}
