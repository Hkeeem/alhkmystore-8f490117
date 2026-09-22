import { useState } from "react";
import { MapPin, X, Check } from "lucide-react";
import {
  STORE_GROUPS,
  CITY_NAMES,
  branchCount,
  storesInGroup,
  useStoreScope,
  type StoreGroupId,
} from "@/lib/store-scope";
import { getStoreIcon } from "@/lib/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** شريط المدينة + فئات المتاجر أسفل الشريط العلوي */
export function StoreScopeBar() {
  const { city, group, setCity, setGroup, scopedStores, isFiltered, reset } = useStoreScope();
  const [open, setOpen] = useState(false);
  const activeGroup = STORE_GROUPS.find((g) => g.id === group)!;

  return (
    <div
      dir="rtl"
      className="sticky top-16 z-30 border-b border-primary/10 bg-background/80 backdrop-blur-xl"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-primary/30 bg-secondary/50 px-3 py-2 text-right hover:border-primary transition"
                aria-label="تغيير المدينة وفئة المتاجر"
              >
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="leading-tight">
                  <span className="block text-xs font-black">{city}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {activeGroup.label} · {scopedStores.length} متجر
                  </span>
                </span>
              </button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="text-right">المدينة وتفضيلات المتاجر</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">اختر مدينتك</p>
                  <div className="grid grid-cols-3 gap-2">
                    {CITY_NAMES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCity(c)}
                        aria-pressed={c === city}
                        className={`rounded-xl px-2 py-2 text-xs font-bold border transition ${
                          c === city
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border/60 hover:border-primary/50"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">فئة المتاجر</p>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pl-1">
                    {STORE_GROUPS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGroup(g.id as StoreGroupId)}
                        className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold border transition ${
                          g.id === group
                            ? "border-primary bg-primary/10"
                            : "border-border/60 hover:border-primary/40"
                        }`}
                      >
                        <span>{g.emoji}</span>
                        <span className="flex-1 text-right">{g.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {branchCount(city, g.id)} فرع
                        </span>
                        {g.id === group && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">
                    المتاجر المتوفرة في {city}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {storesInGroup(group).map((s) => {
                      const Icon = getStoreIcon(s);
                      return (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/60 px-2 py-1 text-[11px] font-bold"
                        >
                          <Icon className="w-3.5 h-3.5 text-primary" />
                          {s.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div
            className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide"
            role="group"
            aria-label="فئات المتاجر"
          >
            {STORE_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroup(g.id)}
                aria-pressed={g.id === group}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold border transition ${
                  g.id === group
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {g.emoji} {g.label}
              </button>
            ))}
          </div>
        </div>

        {isFiltered && (
          <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/25 px-3 py-1.5 text-[11px] font-bold">
            <span className="flex-1">
              النتائج مقصورة على «{activeGroup.label}» في {city} ({scopedStores.length} متجر)
            </span>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <X className="w-3 h-3" />
              إلغاء الفلترة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
