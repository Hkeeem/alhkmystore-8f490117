import { useVisionBadge, type BadgeSize } from "@/hooks/use-vision-badge";

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: "text-[1.8rem]",
  md: "text-[2.6rem]",
  lg: "text-[3.6rem]",
};

const POSITION_CLASS = {
  start: "inset-inline-start-0 -translate-x-0",
  center: "left-1/2 -translate-x-1/2",
  end: "inset-inline-end-4",
} as const;

/** خلفية شفافة مكتوب عليها 2030 داخل الترويسة */
export function VisionBadge() {
  const { settings } = useVisionBadge();
  if (!settings.visible || settings.opacity === 0) return null;

  return (
    <span
      aria-hidden
      className={`vision-2030-bg ${SIZE_CLASS[settings.size]} ${POSITION_CLASS[settings.position]}`}
      style={{ opacity: settings.opacity / 100 }}
    >
      2030
    </span>
  );
}
