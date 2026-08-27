import visionLogo from "@/assets/vision-2030-logo.png";
import { useVisionBadge } from "@/hooks/use-vision-badge";

/** شعار رؤية السعودية 2030 الرسمي كخلفية شفافة داخل الترويسة */
export function VisionBadge() {
  const { settings } = useVisionBadge();
  if (!settings.visible || settings.opacity === 0) return null;

  return (
    <img
      src={visionLogo}
      alt=""
      aria-hidden
      className={`vision-2030-bg vision-${settings.size} vision-${settings.position}`}
      style={{ opacity: settings.opacity / 100 }}
      draggable={false}
    />
  );
}
