import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import "../../styles/hkeeem-theme.css";

type Msg = {
  text: string;
  isUser: boolean;
  product?: { store: string; price: string; saving: string };
};

const quickActions = ["ابحث عن منتج", "أفضل العروض", "قارن الأسعار"];

export default function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      isUser: false,
      text: "مرحباً، أنا حكيم، مساعدك الذكي في Hkeeem AI. كيف يمكنني مساعدتك اليوم؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { isUser: true, text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        {
          isUser: false,
          text: "وجدت لك ثلاثة عروض ممتازة، وأفضلها الآن:",
          product: { store: "نون", price: "4,799 ر.س", saving: "توفير 1,350 ر.س" },
        },
      ]);
    }, 1200);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col"
      style={{ background: "var(--hkeeem-bg)" }}
    >
      <header className="flex items-center gap-3 px-3 py-2.5 border-b border-[rgba(212,175,55,0.2)]">
        <Link to="/hkeeem" className="hkt-gold-text text-xl">
          →
        </Link>
        <div
          className="w-10 h-10 rounded-full hkt-card flex items-center justify-center text-xl"
          style={{ boxShadow: "0 0 12px rgba(212,175,55,0.4)" }}
        >
          ح
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm hkt-gold-text">مساعد Hkeeem AI</p>
          <p className="text-[11px]" style={{ color: "var(--hkeeem-success)" }}>
            متصل الآن
          </p>
        </div>
        <button className="hkt-gold-text text-xl">⋮</button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) =>
          m.isUser ? (
            <div key={i} className="flex justify-start">
              <div
                className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-sm font-semibold text-black"
                style={{ background: "linear-gradient(135deg,#D4AF37,#FFD700)" }}
              >
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] hkt-card px-4 py-3 rounded-2xl rounded-br-sm">
                <p className="text-sm">{m.text}</p>
                {m.product && (
                  <div className="mt-2 p-3 rounded-xl bg-black/30 border border-[rgba(212,175,55,0.5)]">
                    <p className="font-bold hkt-gold-text text-sm">
                      {m.product.store} - {m.product.price}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--hkeeem-success)" }}>
                      {m.product.saving}
                    </p>
                    <button className="hkt-btn-gold w-full mt-2 text-sm !py-2">اشتري الآن</button>
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {typing && (
          <div className="flex justify-end">
            <div className="hkt-card px-4 py-3 rounded-2xl flex gap-1.5">
              <span className="hkt-typing-dot" />
              <span className="hkt-typing-dot" />
              <span className="hkt-typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 px-3 pb-2 overflow-x-auto">
        {quickActions.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="whitespace-nowrap text-xs hkt-gold-text border border-[rgba(212,175,55,0.6)] rounded-full px-3.5 py-1.5"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="border-t border-[rgba(212,175,55,0.2)] p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => send(input)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-black shrink-0"
            style={{
              background: "linear-gradient(135deg,#D4AF37,#FFD700)",
              boxShadow: "0 0 16px rgba(212,175,55,0.4)",
            }}
          >
            ◀
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="اكتب رسالتك..."
            className="hkt-card flex-1 px-4 py-2.5 text-sm outline-none bg-transparent placeholder:text-[#B0B0B0]"
          />
          <button className="hkt-gold-text text-xl">🎤</button>
        </div>
        <p className="text-center text-[10px] mt-1.5" style={{ color: "var(--hkeeem-gold-dark)" }}>
          مدعوم بالذكاء الاصطناعي
        </p>
      </div>
    </div>
  );
}
