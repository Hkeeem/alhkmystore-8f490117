import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "المساعد الذكي - وفّر" },
      { name: "description", content: "اسأل مساعد وفّر عن أي عرض أو أرخص سعر في المملكة." },
    ],
  }),
  component: ChatPage,
});

const suggestions = [
  "وين ألقى أرخص أرز بسمتي؟",
  "أبي أوفر في وجبة عائلية",
  "قارن أسعار الآيفون",
  "أفضل عروض الصيدلية",
];

function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    id: "assistant",
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  async function send(text: string) {
    if (!text.trim()) return;
    setInput("");
    await sendMessage({ text });
  }

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <main className="max-w-3xl mx-auto px-4 pt-6 pb-32 md:pb-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 text-primary text-sm font-bold">
          <Sparkles className="w-4 h-4" />
          مساعد وفّر
        </div>
        <h1 className="font-display font-black text-2xl mt-1">اسألني عن أي عرض</h1>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 -mx-4 px-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-hero shadow-glow flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-6">جرّب أحد الأسئلة:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-right p-3 rounded-2xl bg-card border border-border/50 hover:border-primary hover:shadow-soft text-sm font-medium transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m: UIMessage) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          const mine = m.role === "user";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[85%] ${mine ? "bg-primary text-primary-foreground rounded-3xl rounded-br-lg" : "bg-card border border-border/50 rounded-3xl rounded-bl-lg"} px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-card`}>
                {text}
              </div>
            </div>
          );
        })}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-end">
            <div className="bg-card border border-border/50 rounded-3xl rounded-bl-lg px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> يفكّر...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-4 flex gap-2 sticky bottom-20 md:bottom-0 bg-background/95 backdrop-blur py-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="اكتب سؤالك..."
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-gradient-hero text-primary-foreground rounded-2xl w-12 h-12 flex items-center justify-center shadow-glow disabled:opacity-50"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </form>
    </main>
  );
}
