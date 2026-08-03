import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect, Fragment } from "react";
import { Send, Sparkles, Loader2, Mic, Square, Volume2, VolumeX, Share2, ExternalLink, Bot, Zap, TrendingDown, ShoppingCart, Star, AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ShareSheet } from "@/components/ShareSheet";
import { deals } from "@/data/deals";
import { useRealDeals } from "@/lib/real-deals";

const DEAL_TOKEN = /\{\{deal:([a-zA-Z0-9_-]+)\}\}/g;

function stripDealTokens(text: string): string {
  return text.replace(DEAL_TOKEN, "").replace(/\s{2,}/g, " ").trim();
}

function buildShareText(text: string, origin: string): string {
  return text.replace(DEAL_TOKEN, (_, id) => {
    const d = deals.find((x) => x.id === id);
    if (!d) return "";
    return `\n🔗 ${d.title} — ${d.price} ر.س: ${origin}/deals/${id}?utm_source=hkeeem&utm_medium=chat&utm_campaign=recommendation`;
  }).trim();
}

function RenderWithDealLinks({ text }: { text: string }) {
  const parts: (string | { id: string })[] = [];
  let last = 0;
  for (const m of text.matchAll(DEAL_TOKEN)) {
    if (m.index! > last) parts.push(text.slice(last, m.index));
    parts.push({ id: m[1] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === "string") return <Fragment key={i}>{p}</Fragment>;
        const d = deals.find((x) => x.id === p.id);
        if (!d) return null;
        return (
          <Link
            key={i}
            to="/deals/$id"
            params={{ id: p.id }}
            className="inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary hover:text-primary-foreground transition align-middle"
          >
            <ExternalLink className="w-3 h-3" />
            افتح العرض
          </Link>
        );
      })}
    </>
  );
}

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "حكيم - المساعد الذكي لعروض المملكة" },
      { name: "description", content: "تكلّم أو اكتب مع حكيم، مساعدك الذكي لأفضل عروض السعودية." },
    ],
  }),
  component: ChatPage,
});

const suggestions = [
  { text: "وين ألقى أرخص أرز بسمتي؟", icon: ShoppingCart },
  { text: "أبي أوفر في وجبة عائلية", icon: TrendingDown },
  { text: "قارن أسعار الآيفون", icon: Zap },
  { text: "أفضل عروض الصيدلية اليوم", icon: Star },
  { text: "عروض المواد الغذائية هذا الأسبوع", icon: ShoppingCart },
  { text: "أرخص متجر للإلكترونيات", icon: Zap },
];

function ChatPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [voiceOn, setVoiceOn] = useState(true);
  const [sharePayload, setSharePayload] = useState<{ title: string; text: string } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const spokenRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [failure, setFailure] = useState<{ kind: "chat" | "tts" | "stt"; msg: string } | null>(null);
  const lastSentRef = useRef<string>("");
  const lastSpokenRef = useRef<string>("");

  const { messages, sendMessage, status } = useChat({
    id: "assistant",
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => {
      const msg = e?.message?.includes("429")
        ? "الخدمة مزدحمة حالياً، جرّب بعد لحظات."
        : "تعذّر الاتصال بحكيم. تحقق من الإنترنت وحاول مرة أخرى.";
      setFailure({ kind: "chat", msg });
      toast.error(msg);
    },
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (autoSentRef.current) return;
    const text = (q ?? "").trim();
    if (!text) return;
    autoSentRef.current = true;
    void sendMessage({ text });
    navigate({ search: { q: "" }, replace: true });
  }, [q, sendMessage, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!voiceOn || status === "streaming" || status === "submitted") return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || spokenRef.current.has(last.id)) return;
    const raw = last.parts.map((p) => (p.type === "text" ? p.text : "")).join("").trim();
    const text = stripDealTokens(raw);
    if (!text) return;
    spokenRef.current.add(last.id);
    speak(text);
  }, [messages, status, voiceOn]);

  async function speak(text: string) {
    lastSpokenRef.current = text;
    try {
      audioRef.current?.pause();
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) throw new Error("tts");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setFailure((f) => (f?.kind === "tts" ? null : f));
      audio.play().catch(() => {});
    } catch {
      const msg = "تعذّر تشغيل الرد الصوتي.";
      setFailure({ kind: "tts", msg });
      toast.error(msg, { action: { label: "إعادة المحاولة", onClick: () => void speak(text) } });
    }
  }

  async function send(text: string) {
    if (!text.trim()) return;
    lastSentRef.current = text.trim();
    setInput("");
    setFailure(null);
    await sendMessage({ text: text.trim() });
  }

  function retry() {
    const f = failure;
    setFailure(null);
    if (!f) return;
    if (f.kind === "tts") {
      if (lastSpokenRef.current) void speak(lastSpokenRef.current);
      return;
    }
    if (lastSentRef.current) void sendMessage({ text: lastSentRef.current });
  }


  const isLoading = status === "submitted" || status === "streaming";

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function toggleRecord() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 1500) {
          toast.error("التسجيل قصير جداً، حاول مرة أخرى.");
          return;
        }
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("file", blob, `rec.${mime.includes("mp4") ? "mp4" : "webm"}`);
          const r = await fetch("/api/stt", { method: "POST", body: fd });
          if (!r.ok) throw new Error("stt");
          const data = await r.json();
          const text = (data?.text || "").trim();
          if (!text) throw new Error("empty");
          setFailure(null);
          await send(text);
        } catch {
          const msg = "ما قدرنا نحوّل صوتك لنص. جرّب التسجيل مرة ثانية أو اكتب سؤالك.";
          setFailure({ kind: "stt", msg });
          toast.error(msg, { action: { label: "تسجيل جديد", onClick: () => void toggleRecord() } });
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      const msg = "ما قدرنا نوصل للمايكروفون. تأكد من إذن الميكروفون.";
      setFailure({ kind: "stt", msg });
      toast.error(msg);
    }

  }

  return (
    <main className="max-w-3xl mx-auto px-4 pt-6 pb-32 md:pb-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-hero glow-gold flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-xl">حكيم</h1>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                متصل
              </span>
            </div>
            <p className="text-xs text-muted-foreground">مساعدك الذكي لأفضل عروض المملكة</p>
          </div>
        </div>
        <button
          onClick={() => {
            setVoiceOn((v) => !v);
            if (voiceOn) audioRef.current?.pause();
          }}
          className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-bold border transition flex items-center gap-1 ${voiceOn ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}
          title={voiceOn ? "إيقاف الصوت" : "تشغيل الصوت"}
        >
          {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{voiceOn ? "الصوت شغّال" : "الصوت مقفول"}</span>
        </button>
      </div>

      {/* منطقة المحادثة */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 -mx-4 px-4">
        {messages.length === 0 && (
          <div className="py-6">
            {/* بطاقة الترحيب */}
            <div className="bg-gradient-hero rounded-3xl p-6 mb-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-primary/20 flex items-center justify-center mb-3">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display font-black text-xl text-white mb-1">هلا! أنا حكيم 👋</h2>
              <p className="text-sm text-white/70">اسألني عن أي عرض أو منتج وأنا أساعدك توفّر</p>
            </div>

            {/* اقتراحات سريعة */}
            <p className="text-xs text-muted-foreground mb-3 font-bold">جرّب تسألني:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="text-right p-3 rounded-2xl bg-card border border-border/50 hover:border-primary hover:shadow-soft text-sm font-medium transition flex items-center gap-2 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    {s.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((m: UIMessage) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          const mine = m.role === "user";
          return (
            <div key={m.id} className={`flex flex-col gap-1 ${mine ? "items-start" : "items-end"}`}>
              {!mine && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-hero flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-bold">حكيم</span>
                </div>
              )}
              <div className={`max-w-[85%] ${mine
                ? "bg-primary text-primary-foreground rounded-3xl rounded-br-lg"
                : "bg-card border border-border/50 rounded-3xl rounded-bl-lg"
              } px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-card`}>
                {mine ? text : <RenderWithDealLinks text={text} />}
              </div>
              {!mine && text && (
                <button
                  onClick={() => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    setSharePayload({ title: "توصية من حكيم", text: buildShareText(text, origin) });
                    setShareOpen(true);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 px-2 transition"
                >
                  <Share2 className="w-3 h-3" /> شارك التوصية
                </button>
              )}
            </div>
          );
        })}

        {(isLoading || transcribing) && (
          <div className="flex justify-end">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-6 h-6 rounded-full bg-gradient-hero flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-3xl rounded-bl-lg px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              {transcribing ? "يسمعك..." : (
                <span className="flex items-center gap-1">
                  يفكّر
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {failure && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span className="flex-1 text-foreground">{failure.msg}</span>
          <button
            type="button"
            onClick={retry}
            className="shrink-0 flex items-center gap-1 rounded-xl bg-card border border-border px-3 py-1.5 text-xs font-bold hover:border-primary hover:text-primary transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* شريط الإدخال */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-4 flex gap-2 sticky bottom-20 md:bottom-0 bg-background/95 backdrop-blur py-2"
      >
        <button
          type="button"
          onClick={toggleRecord}
          disabled={isLoading || transcribing}
          className={`shrink-0 rounded-2xl w-12 h-12 flex items-center justify-center shadow-glow transition ${
            recording
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "bg-card border border-border text-primary hover:border-primary hover:bg-primary/5"
          }`}
          title={recording ? "إيقاف التسجيل" : "تسجيل صوتي"}
        >
          {recording ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || recording}
          placeholder={recording ? "🎙 جاري التسجيل..." : "اكتب سؤالك أو استخدم المايك..."}
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-gradient-hero text-primary-foreground rounded-2xl w-12 h-12 flex items-center justify-center shadow-glow disabled:opacity-50 hover:opacity-90 transition"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </form>

      <ShareSheet
        open={shareOpen && !!sharePayload}
        onClose={() => setShareOpen(false)}
        title={sharePayload?.title ?? ""}
        text={sharePayload?.text ?? ""}
      />
    </main>
  );
}
