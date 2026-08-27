import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import introVideo from "@/assets/intro-video.mp4.asset.json";
import introPoster from "@/assets/intro-poster.jpg.asset.json";

const MUTE_KEY = "hkeeem-video-muted";

export function IntroVideo() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  // مكتوم افتراضيًا حتى لا تحجب المتصفحات التشغيل التلقائي
  const [muted, setMuted] = useState(true);
  // تحميل كسول: لا يُحمّل مصدر الفيديو إلا عند اقتراب القسم من الظهور أو عند فتح النافذة
  const [nearby, setNearby] = useState(false);
  // اكتمل التحميل المسبق فيفتح الفيديو فورًا
  const [prefetched, setPrefetched] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (nearby) return;
    const el = sectionRef.current;
    if (!el) return;
    // احترام وضع توفير البيانات والشبكات البطيئة: لا تحميل مسبق
    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || (conn?.effectiveType && /2g/.test(conn.effectiveType))) return;
    if (typeof IntersectionObserver === "undefined") {
      setNearby(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearby(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [nearby]);

  // تلميح للمتصفح ببدء جلب الفيديو مبكرًا عند الاقتراب من القسم
  useEffect(() => {
    if (!nearby || prefetched) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "video";
    link.href = introVideo.url;
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [nearby, prefetched]);


  // استرجاع تفضيل الصوت المحفوظ بعد التحميل (تفاديًا لتعارض SSR)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MUTE_KEY);
      if (stored === "0") setMuted(false);
      else if (stored === "1") setMuted(true);
    } catch {
      /* ignore */
    }
  }, []);

  // مزامنة التفضيل مع عنصر الفيديو وحفظه
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [muted, open]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {
        // في حال منع التشغيل بالصوت، نعيد الكتم ونشغّل
        setMuted(true);
        v.muted = true;
        void v.play().catch(() => undefined);
      });
    } else {
      v.pause();
    }
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card">
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative grid md:grid-cols-2 gap-6 p-5 md:p-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            تعرّف على حكيم AI
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-black leading-tight">
            دقيقة واحدة… <span className="text-gold-shine">وتفهم الفكرة كاملة</span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
            كيف يجمع حكيم AI عروض المتاجر، ويقارن الأسعار، ويرشّح لك الأوفر تلقائيًا.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="mt-6 inline-flex items-center gap-2 bg-gradient-gold text-secondary font-bold px-5 py-3 rounded-2xl hover-lift press-ripple"
          >
            <Play className="w-4 h-4" />
            شغّل الفيديو التعريفي
          </button>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="group relative rounded-2xl overflow-hidden border border-primary/25 shadow-glow"
          aria-label="تشغيل الفيديو التعريفي"
        >
          <img
            src={introPoster.url}
            alt="غلاف الفيديو التعريفي لحكيم AI"
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-secondary/30 group-hover:bg-secondary/20 transition">
            <span className="w-14 h-14 rounded-full bg-gradient-gold text-secondary flex items-center justify-center shadow-glow">
              <Play className="w-6 h-6" />
            </span>
          </span>
        </button>
      </div>

      {/* تحميل مسبق مخفي: يبدأ عند اقتراب القسم فيفتح الفيديو فورًا لاحقًا */}
      {nearby && !open && (
        <video
          src={introVideo.url}
          preload="auto"
          muted
          playsInline
          aria-hidden
          tabIndex={-1}
          className="hidden"
          onCanPlayThrough={() => setPrefetched(true)}
        />
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPlaying(false); }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-secondary border-primary/30">
          <DialogTitle className="sr-only">الفيديو التعريفي لحكيم AI</DialogTitle>
          <DialogDescription className="sr-only">فيديو قصير يشرح فكرة حكيم AI</DialogDescription>
          <div className="relative bg-black">
            {loading && !prefetched && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
            )}
            <video
              ref={videoRef}
              src={introVideo.url}
              poster={introPoster.url}
              playsInline
              autoPlay
              loop
              muted={muted}
              preload="auto"
              onLoadedData={() => setLoading(false)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              className="w-full max-h-[70vh] bg-black"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-secondary">
            <button
              onClick={togglePlay}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary px-3 py-2 text-xs font-bold"
              aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {playing ? "إيقاف" : "تشغيل"}
            </button>
            <button
              onClick={() => setMuted((m) => !m)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary px-3 py-2 text-xs font-bold"
              aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {muted ? "صوت" : "كتم"}
            </button>
            <span className="ms-auto text-[11px] text-primary-foreground/60">
              يتم حفظ إعداد الصوت لزيارتك القادمة
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
