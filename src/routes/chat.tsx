import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect, Fragment } from "react";
import { Send, Sparkles, Loader2, Mic, Square, Volume2, VolumeX, Share2, ExternalLink } from "lucide-react";
import { ShareSheet } from "@/components/ShareSheet";
import { deals } from "@/data/deals";

const DEAL_TOKEN = /\{\{deal:([a-zA-Z0-9_-]+)\}\}/g;

function stripDealTokens(text: string): string {
  return text.replace(DEAL_TOKEN, "").replace(/\s{2,}/g, " ").trim();
}

function buildShareText(text: string, origin: string): string {
  return text.replace(DEAL_TOKEN, (_, id) => {
    const d = deals.find((x) => x.id === id);
    if (!d) return "";
    return `\n🔗 ${d.title} — ${d.price} ر.س: ${origin}/deals/${id}?utm_source=makki&utm_medium=chat&utm_campaign=recommendation`;
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
            افتح
          </Link>
        );
      })}
    </>
  );
}


export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "مكّي - المساعد الصوتي لعروض المملكة" },
      { name: "description", content: "تكلّم أو اكتب مع مكّي، مساعدك الذكي لأفضل عروض السعودية." },
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
  const [voiceOn, setVoiceOn] = useState(true);
  const [sharePayload, setSharePayload] = useState<{ title: string; text: string } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const spokenRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { messages, sendMessage, status } = useChat({
    id: "assistant",
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Speak new assistant messages when done streaming
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
    try {
      audioRef.current?.pause();
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) return;
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
    } catch {}
  }

  async function send(text: string) {
    if (!text.trim()) return;
    setInput("");
    await sendMessage({ text });
  }

  const isLoading = status === "submitted" || status === "streaming";

  // Voice recording
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
        if (blob.size < 1500) return;
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("file", blob, `rec.${mime.includes("mp4") ? "mp4" : "webm"}`);
          const r = await fetch("/api/stt", { method: "POST", body: fd });
          const data = await r.json();
          const text = (data?.text || "").trim();
          if (text) await send(text);
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      alert("ما قدرنا نوصل للمايكروفون");
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pt-6 pb-32 md:pb-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-primary text-sm font-bold">
            <Sparkles className="w-4 h-4" />
            مكّي · مساعدك الصوتي
          </div>
          <h1 className="font-display font-black text-2xl mt-1">اسألني بالصوت أو الكتابة</h1>
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
          {voiceOn ? "الصوت شغّال" : "الصوت مقفول"}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 -mx-4 px-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-hero shadow-glow flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-2">هلا! أنا مكّي.</p>
            <p className="text-muted-foreground text-sm mb-6">اضغط المايك وكلّمني، أو جرّب:</p>
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
            <div key={m.id} className={`flex flex-col gap-1 ${mine ? "items-start" : "items-end"}`}>
              <div className={`max-w-[85%] ${mine ? "bg-primary text-primary-foreground rounded-3xl rounded-br-lg" : "bg-card border border-border/50 rounded-3xl rounded-bl-lg"} px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-card`}>
                {mine ? text : <RenderWithDealLinks text={text} />}
              </div>
              {!mine && text && (
                <button
                  onClick={() => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    setSharePayload({ title: "توصية من مكّي", text: buildShareText(text, origin) });
                    setShareOpen(true);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 px-2"
                >
                  <Share2 className="w-3 h-3" /> شارك التوصية
                </button>
              )}
            </div>
          );
        })}

        {(isLoading || transcribing) && (
          <div className="flex justify-end">
            <div className="bg-card border border-border/50 rounded-3xl rounded-bl-lg px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> {transcribing ? "يسمعك..." : "يفكّر..."}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-4 flex gap-2 sticky bottom-20 md:bottom-0 bg-background/95 backdrop-blur py-2"
      >
        <button
          type="button"
          onClick={toggleRecord}
          disabled={isLoading || transcribing}
          className={`shrink-0 rounded-2xl w-12 h-12 flex items-center justify-center shadow-glow transition ${recording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-card border border-border text-primary hover:border-primary"}`}
          title={recording ? "إيقاف التسجيل" : "تسجيل صوتي"}
        >
          {recording ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || recording}
          placeholder={recording ? "جاري التسجيل..." : "اكتب سؤالك أو استخدم المايك..."}
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

      <ShareSheet
        open={shareOpen && !!sharePayload}
        onClose={() => setShareOpen(false)}
        title={sharePayload?.title ?? ""}
        text={sharePayload?.text ?? ""}
      />
    </main>
  );
}
