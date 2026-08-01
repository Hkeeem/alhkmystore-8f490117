import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * يؤجّل عرض محتوى القسم حتى يقترب من نطاق الرؤية،
 * لتحسين سلاسة التمرير وتقليل استهلاك الذاكرة.
 */
export function LazySection({
  children,
  minHeight = 240,
  rootMargin = "300px",
  className,
  id,
}: {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} id={id} className={className} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}
