import { useEffect, useState } from "react";
import { Play, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import introPoster from "@/assets/intro-poster.jpg.asset.json";

const MUTE_KEY = "hkeeem-video-muted";
const YOUTUBE_VIDEO_ID = "1GJDqZIn-fw";
const YOUTUBE_EMBED_URL = `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`;

export function IntroVideo() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    try {
      localStorage.getItem(MUTE_KEY);
    } catch {
      // Local storage may be unavailable in private browsing contexts.
    }
  }, []);

  return (
    <section className="relative w-full max-w-7xl mx-auto overflow-hidden rounded-[2rem] md:rounded-[3rem] border border-primary/20 shadow-glow group">
      <div className="absolute inset-0 z-0">
        <img
          src={introPoster.url}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-[15s] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-secondary/50" />
        <div className="absolute inset-0 bg-linear-to-t from-secondary via-secondary/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-l from-secondary/80 via-secondary/20 to-transparent hidden md:block" />
      </div>

      <div className="relative z-10 aspect-square md:aspect-video w-full flex flex-col justify-end md:justify-center p-6 md:p-12 lg:p-20">
        <div className="max-w-2xl transform transition-transform duration-700 group-hover:translate-x-[-0.5rem]">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-md text-primary text-xs font-bold mb-4 md:mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            تعرّف على حكيم AI
          </div>

          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-black leading-tight text-foreground mb-3 md:mb-5 drop-shadow-lg">
            دقيقة واحدة… <span className="text-gold-shine">وتفهم الفكرة كاملة</span>
          </h2>

          <p className="text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-lg mb-6 md:mb-8">
            كيف يجمع حكيم AI عروض المتاجر، ويقارن الأسعار، ويرشّح لك الأوفر تلقائيًا.
          </p>

          <button
            onClick={() => {
              setFailed(false);
              setLoading(true);
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-gradient-gold text-secondary font-bold px-5 py-3 rounded-2xl hover-lift press-ripple shadow-glow"
            aria-label="تشغيل الفيديو التعريفي"
          >
            <Play className="w-4 h-4" />
            شغّل الفيديو التعريفي
          </button>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-primary/10 rounded-[2rem] md:rounded-[3rem]" />

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setLoading(true);
            setFailed(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-secondary border-primary/30">
          <DialogTitle className="sr-only">الفيديو التعريفي لحكيم AI</DialogTitle>
          <DialogDescription className="sr-only">فيديو قصير يشرح فكرة حكيم AI</DialogDescription>
          <div className="relative aspect-video bg-black">
            {loading && !failed && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
            )}
            {failed ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary/95 p-6 text-center">
                <img
                  src={introPoster.url}
                  alt="غلاف الفيديو التعريفي"
                  className="w-full max-w-md rounded-2xl border border-primary/25 shadow-glow opacity-90"
                />
                <p className="text-sm md:text-base text-muted-foreground max-w-sm">
                  تعذّر تحميل الفيديو من YouTube. يمكنك فتحه مباشرة من الرابط الخارجي.
                </p>
                <a
                  href={`https://www.youtube.com/shorts/${YOUTUBE_VIDEO_ID}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-gold text-secondary font-bold px-5 py-2.5 text-sm hover-lift press-ripple"
                >
                  فتح الفيديو في YouTube
                </a>
              </div>
            ) : (
              <iframe
                src={YOUTUBE_EMBED_URL}
                title="الفيديو التعريفي لحكيم AI"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setFailed(true);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
