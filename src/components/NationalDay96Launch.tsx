// src/components/NationalDay96Launch.tsx - نسخة آمنة 100% لـ SSR
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
      if (typeof navigator!== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(txt);
      }
    } catch {}
    setCopied(txt);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!mounted) {
    return <div dir="rtl" className="min-h-screen bg-[#0f0a2a] text-white grid place-items-center"><div className="text-[#d4af37] font-black">جاري تحميل احتفال 96...</div></div>;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0f0a2a] text-white">
      <div className="w-full bg-gradient-to-r from-[#1a5c2a] to-[#d4af37] text-center py-2 text-xs font-bold">🇸🇦 افتتاح Alhkmy.store - اليوم الوطني 96 عز وعزوة - 96 ساعة فقط - كود KSA96</div>
      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
        <div className="text-[80px] md:text-[120px] font-black leading-none text-[#d4af37]">96</div>
        <h1 className="text-3xl md:text-5xl font-black mt-2">اليوم الوطني السعودي <span className="text-[#d4af37]">عز وعزوة</span></h1>
        <div className="mt-8 flex justify-center gap-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 min-w-[90px]"><div className="text-3xl font-black text-[#d4af37]">{String(t.h).padStart(2,"0")}</div><div className="text-[11px] opacity-60">ساعة</div></div>
          <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 min-w-[90px]"><div className="text-3xl font-black text-[#d4af37]">{String(t.m).padStart(2,"0")}</div><div className="text-[11px] opacity-60">دقيقة</div></div>
          <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 min-w-[90px]"><div className="text-3xl font-black text-[#d4af37]">{String(t.s).padStart(2,"0")}</div><div className="text-[11px] opacity-60">ثانية</div></div>
        </div>
        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <button onClick={()=>copy("KSA96")} className="rounded-full bg-[#d4af37] text-black px-8 py-3 font-black">{copied==="KSA96"? "تم النسخ" : "انسخ كود KSA96 - خصم 30%"}</button>
          <a href="/" className="rounded-full border border-white/20 px-8 py-3 font-bold">تسوق الان</a>
        </div>
      </div>
    </div>
  );
}
