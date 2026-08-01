import { Settings2, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { BADGE_POSITIONS, BADGE_SIZES, useVisionBadge } from "@/hooks/use-vision-badge";

export function VisionBadgeSettings({ className = "" }: { className?: string }) {
  const { settings, update, reset } = useVisionBadge();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="إعدادات خلفية 2030"
          title="إعدادات خلفية 2030"
          className={`p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition ${className}`}
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 rounded-2xl border-border bg-popover p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display font-black text-sm">خلفية 2030</div>
            <div className="text-[11px] text-muted-foreground">تحكّم بالشفافية والمكان</div>
          </div>
          <Switch
            checked={settings.visible}
            onCheckedChange={(v) => update({ visible: v })}
            aria-label="إظهار خلفية 2030"
          />
        </div>

        <div className={settings.visible ? "space-y-4" : "space-y-4 opacity-50 pointer-events-none"}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold">مستوى الشفافية</label>
              <span className="text-xs tabular-nums text-muted-foreground">{settings.opacity}%</span>
            </div>
            <Slider
              value={[settings.opacity]}
              min={0}
              max={60}
              step={1}
              onValueChange={([v]) => update({ opacity: v })}
              aria-label="مستوى الشفافية"
            />
          </div>

          <div>
            <div className="text-xs font-bold mb-2">المكان داخل الترويسة</div>
            <div className="grid grid-cols-3 gap-1.5">
              {BADGE_POSITIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => update({ position: p.id })}
                  aria-pressed={settings.position === p.id}
                  className={`px-2 py-2 rounded-xl text-[11px] font-bold transition border ${
                    settings.position === p.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold mb-2">الحجم</div>
            <div className="grid grid-cols-3 gap-1.5">
              {BADGE_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => update({ size: s.id })}
                  aria-pressed={settings.size === s.id}
                  className={`px-2 py-2 rounded-xl text-[11px] font-bold transition border ${
                    settings.size === s.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> استعادة الافتراضي
        </button>
      </PopoverContent>
    </Popover>
  );
}
