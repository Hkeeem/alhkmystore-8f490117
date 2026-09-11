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
  // حالة فشل تحميل الفيديو لعرض بديل لطيف
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (nearby) return;
    const el = sectionRef.current;
    if (!el) return;
    // احترام وضع توفير البيانات والشبكات البطيئة: لا تحميل مسبق
    const conn = (
      navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
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
    <section
      ref={sectionRef}
      className="relative w-full max-w-7xl mx-auto overflow-hidden rounded-[2rem] md:rounded-[3rem] border border-primary/20 shadow-glow group"
    >
      {/* طبقة الغلاف/الفيديو الثابتة مع قص مناسب */}
      <div className="absolute inset-0 z-0">
        <img
          src={introPoster.url}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-[15s] ease-out group-hover:scale-105"
        />
        {/* طبقات تدرج لضمان قراءة النص على كل الأحجام */}
        <div className="absolute inset-0 bg-secondary/50" />
        <div className="absolute inset-0 bg-linear-to-t from-secondary via-secondary/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-l from-secondary/80 via-secondary/20 to-transparent hidden md:block" />
      </div>

      {/* المحتوى الأمامي */}
      <div className="relative z-10 aspect-square md:aspect-video w-full flex flex-col justify-end md:justify-center p-6 md:p-12 lg:p-20">
        <div className="max-w-2xl transform transition-transform duration-700 group-hover:translate-x-[-0.5rem]">
          {/* شارة القسم */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-md text-primary text-xs font-bold mb-4 md:mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            تعرّف على حكيم AI
          </div>

          {/* العنوان */}
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-black leading-tight text-foreground mb-3 md:mb-5 drop-shadow-lg">
            دقيقة واحدة… <span className="text-gold-shine">وتفهم الفكرة كاملة</span>
          </h2>

          {/* الوصف */}
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-lg mb-6 md:mb-8">
            كيف يجمع حكيم AI عروض المتاجر، ويقارن الأسعار، ويرشّح لك الأوفر تلقائيًا.
          </p>

          {/* زر التشغيل */}
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-gold text-secondary font-bold px-5 py-3 rounded-2xl hover-lift press-ripple shadow-glow"
            aria-label="تشغيل الفيديو التعريفي"
          >
            <Play className="w-4 h-4" />
            شغّل الفيديو التعريفي
          </button>
        </div>
      </div>

      {/* إطار زخرفي */}
      <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-primary/10 rounded-[2rem] md:rounded-[3rem]" />

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
          onError={() => setPrefetched(false)}
        />
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setPlaying(false);
        }}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-secondary border-primary/30">
          <DialogTitle className="sr-only">الفيديو التعريفي لحكيم AI</DialogTitle>
          <DialogDescription className="sr-only">فيديو قصير يشرح فكرة حكيم AI</DialogDescription>
          <div className="relative bg-black">
            {loading && !prefetched && !failed && (
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
              onLoadedData={() => {
                setLoading(false);
                setFailed(false);
              }}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              className="w-full max-h-[70vh] bg-black"
            />
            {failed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary/95 p-6 text-center">
                <img
                  src={introPoster.url}
                  alt="غلاف الفيديو التعريفي"
                  className="w-full max-w-md rounded-2xl border border-primary/25 shadow-glow opacity-90"
                />
                <p className="text-sm md:text-base text-muted-foreground max-w-sm">
                  الفيديو ما تحمّل للتو… لكن الفكرة كاملة بين إيديك من صفحات التطبيق.
                </p>
                <button
                  onClick={() => {
                    setFailed(false);
                    setLoading(true);
                    if (videoRef.current) {
                      videoRef.current.load();
                      void videoRef.current.play().catch(() => undefined);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-gold text-secondary font-bold px-5 py-2.5 text-sm hover-lift press-ripple"
                  aria-label="إعادة محاولة تشغيل الفيديو"
                >
                  <Play className="w-4 h-4" />
                  جرّب مرة ثانية
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 bg-secondary">
            {!failed ? (
              <>
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
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                التشغيل غير متاح حاليًا، جرّب إعادة المحاولة أو تصفّح التطبيق.
              </span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
