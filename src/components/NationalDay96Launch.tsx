
// src/components/NationalDay96Launch.tsx - نسخة آمنة 100% لـ SSR + Vercel
import { useEffect, useState } from "react";

export default function NationalDay96Launch() {
  const [mounted, setMounted] = useState(false);
  const [t, setT] = useState({ h: 96, m: 0, s: 0 });
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setMounted(true);
    const end = Date.now() + 96 * 60 * 60 * 1000;
    const id = setInterval(() => {
      const d = Math.max(0, end - Date.now());
      setT({
        h: Math.floor(d / 3600000),
        m: Math.floor((d % 3600000) / 60000),
        s: Math.floor((d % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const copy = (txt: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(txt);
      }
    } catch {}
    setCopied(txt);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!mounted) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#0f0a2a] text-white grid place-items-center">
        <div className="text-[#d4af37] font-black">جاري تحميل احتفال 96...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0f0a2a] text-white">
      <div className="w-full bg-gradient-to-r from-[#1a5c2a] to-[#d4af37] text-center py-2 text-xs font-bold">
        🇸🇦 افتتاح Alhkmy.store - اليوم الوطني 96 عز وعزوة - 96 ساعة فقط - كود KSA96
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
        <div className="text-[80px] md:text-[120px] font-black leading-none text-[#d4af37]">96</div>
        <h1 className="text-3xl md:text-5xl font-black mt-2">اليوم الوطني السعودي <span className="text-[#d4af37]">عز وعزوة</span></h1>
        <p className="mt-4 text-white/60 max-w-2xl mx-auto">من حكيم AI الى Alhkmy.store - منصة سعودية ذكية - نحتفل معك بالافتتاح الكبير</p>

        <div className="mt-8 flex justify-center gap-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 min-w-[90px]">
            <div className="text-3xl font-black text-[#d4af37]">{String(t.h).padStart(2,"0")}</div>
            <div className="text-[11px] opacity-60">ساعة</div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 min-w-[90px]">
            <div className="text-3xl font-black text-[#d4af37]">{String(t.m).padStart(2,"0")}</div>
            <div className="text-[11px] opacity-60">دقيقة</div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 min-w-[90px]">
            <div className="text-3xl font-black text-[#d4af37]">{String(t.s).padStart(2,"0")}</div>
            <div className="text-[11px] opacity-60">ثانية</div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <button onClick={()=>copy("KSA96")} className="rounded-full bg-[#d4af37] text-black px-8 py-3 font-black hover:bg-[#f7e39c]">
            {copied==="KSA96" ? "تم النسخ" : "انسخ كود KSA96 - خصم 30%"}
          </button>
          <a href="/" className="rounded-full border border-white/20 px-8 py-3 font-bold">تسوق الان</a>
        </div>

        <div className="mt-12 grid md:grid-cols-4 gap-4 text-right">
          {[
            {title:"عرض 96 ريال", desc:"20 منتج مختار", code:"96SAR"},
            {title:"فلاش 96%", desc:"كل 6 ساعات منتج", code:"FLASH96"},
            {title:"خصم 30% عام", desc:"على كل المتجر", code:"KSA96"},
            {title:"شحن مجاني", desc:"هدية العلم", code:"FREE96"},
          ].map(o=>(
            <div key={o.code} className="rounded-2xl bg-[#14102f] border border-[#d4af37]/20 p-5">
              <div className="font-black text-[#d4af37]">{o.title}</div>
              <div className="text-xs opacity-60 mt-1">{o.desc}</div>
              <button onClick={()=>copy(o.code)} className="mt-3 w-full rounded-full bg-white/10 py-2 text-xs font-bold">
                {copied===o.code ? "تم" : o.code}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
