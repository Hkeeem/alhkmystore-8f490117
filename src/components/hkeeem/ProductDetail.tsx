import { Link } from "react-router-dom";
import { Link } from "@tanstack/react-router";

const stores = [
  { name: "نون", price: 4799, discount: 22, best: true },
  { name: "جرير", price: 4899, discount: 20, best: false },
  { name: "أمازون", price: 4950, discount: 19, best: false },
];

export default function ProductDetail() {
  return (
    <div dir="rtl" className="min-h-screen pb-28" style={{ background: "var(--hkeeem-bg)" }}>
      <header className="flex items-center justify-between px-4 pt-3">
        <Link to="/hkeeem" className="hk-gold-text text-xl">→</Link>
        <div className="flex gap-4 hk-gold-text text-xl">
          <button>↗</button>
          <button>♥</button>
        </div>
      </header>

      <div className="hk-card relative mx-4 mt-4 h-64 flex items-center justify-center text-8xl"
        style={{ boxShadow: "0 0 24px rgba(212,175,55,0.25)" }}>
        📱
        <span className="hk-ai-badge absolute top-4 right-4">رشحه AI ✨</span>
      </div>

      <div className="px-4 mt-4">
        <h2 className="text-lg font-black">آيفون 15 برو ماكس 256 جيجا</h2>
        <p className="text-sm mt-1">
          <span className="hk-gold-text">⭐ 4.8</span>{" "}
          <span className="hk-dim-text text-xs">(2,341 تقييم)</span>
        </p>
      </div>

      <div className="px-4 mt-5">
        <h3 className="font-bold mb-3">💰 مقارنة الأسعار من {stores.length} متاجر</h3>
        <div className="space-y-2.5">
          {stores.map((s) => (
            <div key={s.name} className="hk-card p-4 flex items-center justify-between"
              style={s.best ? { borderColor: "rgba(212,175,55,0.8)" } : undefined}>
              <div className="flex items-center gap-2">
                <span className="font-bold">{s.name}</span>
                {s.best && (
                  <span className="bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-0.5 rounded-lg">الأفضل</span>
                )}
              </div>
              <div className="text-left">
                <p className="font-black hk-gold-text">{s.price.toLocaleString()} ر.س</p>
                <p className="text-xs" style={{ color: "var(--hkeeem-success)" }}>⬇ خصم {s.discount}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hk-savings mx-4 mt-4 p-4 flex justify-between items-center">
        <p className="font-bold text-sm">💰 ستوفر عند الشراء من نون</p>
        <p className="text-xl font-black">1,350 ر.س</p>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-[#0A0A0A]/95 border-t border-[rgba(212,175,55,0.3)] p-4 flex gap-3">
        <button className="hk-btn-gold flex-[3]">🛍️ اشتري الآن من نون</button>
        <button className="hk-btn-outline flex-1">♥ مفضلة</button>
      </div>

      <Link to="/hkeeem/chat"
        className="hk-assistant-float fixed bottom-24 left-4 w-14 h-14 rounded-full flex items-center justify-center text-2xl z-50"
        style={{ background: "linear-gradient(135deg,#D4AF37,#FFD700)" }}>
        🤖
      </Link>
    </div>
  );
}
