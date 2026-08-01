import { useVisionBadge } from "@/hooks/use-vision-badge";

/** خلفية شفافة مكتوب عليها 2030 داخل الترويسة */
export function VisionBadge() {
  const { settings } = useVisionBadge();
  if (!settings.visible || settings.opacity === 0) return null;

  return (
    <span
      aria-hidden
      className={`vision-2030-bg vision-${settings.size} vision-${settings.position}`}
      style={{ opacity: settings.opacity / 100 }}
    >
      2030
    </span>
  );
}

