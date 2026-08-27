import visionLogo from "@/assets/vision-2030-logo.png";
import { useVisionBadge } from "@/hooks/use-vision-badge";

/** شعار رؤية السعودية 2030 الرسمي كشارة واضحة بجانب شعار HkeeemAI */
export function VisionBadge() {
  const { settings } = useVisionBadge();
  if (!settings.visible || settings.opacity === 0) return null;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }[settings.size];

  return (
    <span
      aria-label="رؤية السعودية 2030"
      title="رؤية السعودية 2030"
      className={`inline-flex items-center justify-center rounded-full bg-background/80 border border-primary/30 shadow-sm p-1 ${sizeClasses}`}
      style={{ opacity: Math.max(0.7, settings.opacity / 100) }}
    >
      <img
        src={visionLogo}
        alt="شعار رؤية السعودية 2030"
        className="w-full h-full object-contain"
        draggable={false}
      />
    </span>
  );
}
