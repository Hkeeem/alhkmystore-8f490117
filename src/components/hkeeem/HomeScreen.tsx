import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import "../../styles/hkeeem-theme.css";

const products = [
  { id: 1, name: "قلاية هوائية نينجا", store: "نون", price: 359, old: 549, discount: 35 },
  { id: 2, name: "آيفون 15 برو ماكس", store: "جرير", price: 4799, old: 6149, discount: 22 },
  { id: 3, name: "ماكينة قهوة ديلونجي", store: "إكسترا", price: 1699, old: 1999, discount: 15 },
];

const banners = [
  { title: "عروض مميزة", sub: "مختارة لك بالذكاء الاصطناعي" },
  { title: "خصومات الجمعة", sub: "حتى 50% على الإلكترونيات" },
  { title: "وفّر أكثر", sub: "قارن الأسعار قبل الشراء" },
];

const categories = [
  { name: "المتاجر", icon: "🏬" },
  { name: "الأقسام", icon: "▦" },
  { name: "العقارات", icon: "🏠" },
  { name: "السيارات", icon: "🚗" },
  { name: "عروض AI", icon: "✨" },
];

export default function HomeScreen() {
  const [banner, setBanner] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBanner((b) => (b + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen pb-24" style={{ background: "var(--hkeeem-bg)" }}>
      <header className="flex items-center justify-between px-4 pt-3">
        <button className="relative text-2xl">
          🔔
          <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black hk-gold-text">hkeeemAI ✨</h1>
          <p className="text-xs hk-dim-text">تسوّق أذكى .. ووفّر أكثر</p>
        </div>
        <button className="text-2xl hk-gold-text">☰</button>
      </header>

      <div className="flex gap-2 px-4 mt-3">
        <button className="hk-card px-3 hk-gold-text text-xl" title="مسح">
          ▦
        </button>
        <div className="hk-card flex-1 flex items-center gap-2 px-4 py-2">
          <span className="hk-gold-text">🔍</span>
          <input
            className="bg-transparent flex-1 outline-none text-sm placeholder:text-[#B0B0B0]"
            placeholder="ابحث عن منتج أو عرض أو متجر..."
          />
        </div>
      </div>

      <div className="flex justify-around px-2 mt-5">
        {categories.map((c) => (
          <div key={c.name} className="flex flex-col items-center gap-1">
            <div className="hk-card w-14 h-14 rounded-full flex items-center justify-center text-xl hk-gold-text">
              {c.icon}
            </div>
            <span className="text-[11px] hk-dim-text">{c.name}</span>
          </div>
        ))}
      </div>

      <div className="px-4 mt-5">
        <div
          className="hk-card relative overflow-hidden h-40"
          style={{ background: "linear-gradient(135deg,#1A1408,#3A2E0A)" }}
        >
          <div className="p-5">
            <h2 className="text-xl font-black hk-gold-text">{banners[banner].title}</h2>
            <p className="text-sm hk-dim-text mt-1">{banners[banner].sub}</p>
            <button className="hk-btn-gold mt-3 text-sm !py-2 !px-4">‹ اكتشف الآن</button>
          </div>
          <span className="absolute left-6 bottom-4 text-6xl opacity-80">🛍️</span>
        </div>
        <div className="flex justify-center gap-1.5 mt-2">
          {banners.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === banner ? 18 : 6,
                background: i === banner ? "#D4AF37" : "rgba(212,175,55,0.3)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center px-4">
          <h3 className="font-bold">⭐ أفضل العروض لك</h3>
          <span className="text-xs hk-gold-text">‹ عرض الكل</span>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 mt-3 pb-2">
          {products.map((p) => (
            <Link
              to="/hkeeem/product"
              key={p.id}
              className="bg-white rounded-2xl p-3 w-40 shrink-0 text-black block"
            >
              <div className="relative bg-gray-100 rounded-xl h-24 flex items-center justify-center text-4xl">
                📱
                <span className="absolute top-1.5 right-1.5 bg-[#D4AF37] text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                  خصم {p.discount}%
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">{p.store}</p>
              <p className="text-[13px] font-bold truncate">{p.name}</p>
              <p className="text-[15px] font-black mt-1">{p.price.toLocaleString()} ر.س</p>
              <p className="text-[10px] text-gray-400 line-through">{p.old.toLocaleString()} ر.س</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="hk-savings mx-4 mt-4 p-4 flex justify-between items-center">
        <div>
          <p className="font-bold text-sm">💰 وفرت اليوم</p>
          <p className="text-xs opacity-80">من خلال 3 عروض ذكية</p>
        </div>
        <p className="text-xl font-black">1,240 ر.س</p>
      </div>

      <Link to="/hkeeem/nearby" className="hk-card mx-4 mt-4 p-4 flex items-center gap-3 block">
        <span className="text-2xl hk-gold-text">📍</span>
        <div className="flex-1">
          <p className="font-bold text-sm">العروض القريبة منك</p>
          <p className="text-xs hk-dim-text">اكتشف أفضل العروض في محيطك الآن</p>
        </div>
        <span className="hk-gold-text">‹</span>
      </Link>

      <Link
        to="/hkeeem/chat"
        className="hk-assistant-float fixed bottom-24 left-4 w-14 h-14 rounded-full flex items-center justify-center text-2xl z-50"
        style={{ background: "linear-gradient(135deg,#D4AF37,#FFD700)" }}
      >
        🤖
      </Link>

      <nav className="fixed bottom-0 inset-x-0 bg-[#161616] border-t border-[rgba(212,175,55,0.3)] flex justify-around py-2 z-40">
        {[
          ["الرئيسية", "🏠", "/hkeeem"],
          ["البحث", "🔍", "/hkeeem"],
          ["الخريطة", "📍", "/hkeeem/nearby"],
          ["السلة", "🛒", "/hkeeem"],
          ["المفضلة", "♥", "/hkeeem"],
          ["حسابي", "👤", "/hkeeem"],
        ].map(([label, icon, to], i) => (
          <Link
            to={to as string}
            key={label as string}
            className={`flex flex-col items-center text-[10px] ${i === 0 ? "hk-gold-text" : "hk-dim-text"}`}
          >
            <span className="text-lg">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
