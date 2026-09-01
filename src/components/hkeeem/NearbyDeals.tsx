import { useState } from "react";
import { Link } from "@tanstack/react-router";
import "../../styles/hkeeem-theme.css";

const distances = ["1 كم", "3 كم", "5 كم", "10 كم"];

const deals = [
  {
    store: "نون إكسبرس", product: "سماعات AirPods", distance: "850 متر",
    price: 899, old: 1299, discount: 30, endsIn: "ينتهي خلال ساعتين", ai: false,
  },
  {
    store: "إكسترا", product: 'تلفاز سامسونج 55"', distance: "1.2 كم",
    price: 2199, old: 2899, discount: 25, endsIn: null, ai: true,
  },
];

export default function NearbyDeals() {
  const [dist, setDist] = useState(1);

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "var(--hkeeem-bg)" }}>
      <header className="flex items-center justify-between px-4 pt-3">
        <Link to="/hkeeem" className="hk-gold-text text-xl">→</Link>
        <h2 className="font-black hk-gold-text">📍 العروض القريبة</h2>
        <button className="hk-gold-text text-xl">⚙</button>
      </header>

      <div className="relative h-60 mt-3" style={{ background: "#0F0F0F" }}>
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,55,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.25) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
        <span className="absolute top-10 right-16 bg-[#D4AF37] text-black text-xs font-bold px-2 py-1 rounded-full">35% 📍</span>
        <span className="absolute top-24 left-20 bg-[#D4AF37] text-black text-xs font-bold px-2 py-1 rounded-full">22% 📍</span>
        <span className="absolute bottom-10 right-28 bg-[#D4AF37] text-black text-xs font-bold px-2 py-1 rounded-full">15% 📍</span>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="block w-4 h-4 bg-[#FFD700] rounded-full animate-ping absolute" />
          <span className="block w-4 h-4 bg-[#FFD700] rounded-full border-2 border-black" />
        </span>
      </div>

      <div className="flex gap-2 px-4 mt-3 overflow-x-auto pb-1">
        {distances.map((d, i) => (
          <button key={d} onClick={() => setDist(i)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
              i === dist
                ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                : "hk-gold-text border-[rgba(212,175,55,0.5)]"
            }`}>
            {d}
          </button>
        ))}
      </div>

      <div className="px-4 mt-3 space-y-3 pb-40">
        {deals.map((d) => (
          <div key={d.store} className="hk-card p-4 flex gap-3">
            <div className="w-16 h-16 rounded-xl bg-black/30 flex items-center justify-center text-3xl">🎧</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm">{d.store}</p>
                {d.ai && <span className="hk-ai-badge">🎯 AI</span>}
              </div>
              <p className="text-xs hk-dim-text">{d.product}</p>
              <p className="text-[11px] hk-gold-text mt-1">📍 على بُعد {d.distance}</p>
              {d.endsIn && (
                <p className="text-[11px]" style={{ color: "var(--hkeeem-danger)" }}>⏰ {d.endsIn}</p>
              )}
            </div>
            <div className="text-left">
              <span className="bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-0.5 rounded-lg">
                خصم {d.discount}%
              </span>
              <p className="font-black hk-gold-text mt-1">{d.price.toLocaleString()} ر.س</p>
              <p className="text-[10px] hk-dim-text line-through">{d.old.toLocaleString()} ر.س</p>
            </div>
          </div>
        ))}
      </div>

      <div className="hk-savings fixed bottom-20 inset-x-4 p-3.5 flex justify-between items-center z-40">
        <p className="font-bold text-sm">💰 وفرت اليوم من عرضين</p>
        <p className="text-lg font-black">1,100 ر.س</p>
      </div>

      <Link to="/hkeeem/chat"
        className="hk-assistant-float fixed bottom-40 left-4 w-14 h-14 rounded-full flex items-center justify-center text-2xl z-50"
        style={{ background: "linear-gradient(135deg,#D4AF37,#FFD700)" }}>
        🤖
      </Link>
    </div>
  );
}
