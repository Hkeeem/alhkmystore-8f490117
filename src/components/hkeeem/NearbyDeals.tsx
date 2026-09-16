import { useState } from "react";
import { Link } from "@tanstack/react-router";
import "../../styles/hkeeem-theme.css";

const distances = ["1 كم", "3 كم", "5 كم", "10 كم"];

const deals = [
  {
    store: "نون إكسبرس",
    product: "سماعات AirPods",
    distance: "850 متر",
    price: 899,
    old: 1299,
    discount: 30,
    endsIn: "ينتهي خلال ساعتين",
    ai: false,
  },
  {
    store: "إكسترا",
    product: 'تلفاز سامسونج 55"',
    distance: "1.2 كم",
    price: 2199,
    old: 2899,
    discount: 25,
    endsIn: null,
    ai: true,
  },
];

export default function NearbyDeals() {
  const [dist, setDist] = useState(1);

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "var(--hkeeem-bg)" }}>
      <header className="flex items-center justify-between px-4 pt-3">
        <Link to="/hkeeem" className="hkt-gold-text text-xl">
          →
        </Link>
        <h2 className="font-black hkt-gold-text">📍 العروض القريبة</h2>
        <button className="hkt-gold-text text-xl">⚙</button>
      </header>

      <div className="relative h-60 mt-3" style={{ background: "#0F0F0F" }}>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,55,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.25) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <span className="absolute top-10 right-16 bg-[#D4AF37] text-black text-xs font-bold px-2 py-1 rounded-full">
          35% 📍
        </span>
        <span className="absolute top-24 left-20 bg-[#D4AF37] text-black text-xs font-bold px-2 py-1 rounded-full">
          22% 📍
        </span>
        <span className="absolute bottom-10 right-28 bg-[#D4AF37] text-black text-xs font-bold px-2 py-1 rounded-full">
          15% 📍
        </span>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="block w-4 h-4 bg-[#FFD700] rounded-full animate-ping absolute" />
          <span className="block w-4 h-4 bg-[#FFD700] rounded-full border-2 border-black" />
        </span>
      </div>

      <div className="flex gap-2 px-4 mt-3 overflow-x-auto pb-1">
        {distances.map((d, i) => (
          <button
            key={d}
            onClick={() => setDist(i)}
            className={`px-4 py-1.5 rounded-full
