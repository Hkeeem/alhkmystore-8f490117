import { useState } from "react";
import { MapPin, X, Check } from "lucide-react";
import {
  STORE_GROUPS,
  CITY_NAMES,
  useStoreScope,
  type StoreGroupId,
  type GeoScope,
} from "@/lib/store-scope";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** شريط المدينة + فئات المتاجر أسفل الشريط العلوي */
export function StoreScopeBar() {
  const { selectedCity, setSelectedCity, geoScope, setGeoScope, activeGroup, setActiveGroup } = useStoreScope();
  const [open, setOpen] = useState(false);
  const currentGroup = STORE_GROUPS.find((g) => g.id === activeGroup) || STORE_GROUPS[0];

  return (
    <div
      dir="rtl"
      className="sticky top-16 z-30 border-b border-primary/10 bg-background/80 backdrop-blur-xl"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* زر نافذة اختيار المدينة والنطاق */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/15 transition shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedCity}</span>
                <span className="text-[10px] opacity-75">
                  ({geoScope === "neighborhood" ? "داخل الحي" : geoScope === "city" ? "المدينة" : "كل المناطق"})
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-3xl p-6" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-right">حدد نطاق البحث الجغرافي</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-2">اختر المدينة:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CITY_NAMES.map((city) => (
                      <button
                        key={city}
                        onClick={() => setSelectedCity(city)}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                          selectedCity === city
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
                        }`}
                      >
                        <span>{city}</span>
                        {selectedCity === city && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/50 pt-3">
                  <label className="text-xs font-bold text-muted-foreground block mb-2">نطاق مقارنة المتاجر:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "neighborhood", label: "الحي" },
                      { id: "city", label: "المدينة" },
                      { id: "all", label: "الكل" },
                    ].map((scope) => (
                      <button
                        key={scope.id}
                        onClick={() => setGeoScope(scope.id as GeoScope)}
                        className={`p-2 rounded-xl text-xs font-bold transition text-center ${
                          geoScope === scope.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
                        }`}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="w-full mt-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm"
                >
                  تطبيق النطاق
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* فئات المتاجر السريعة */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {STORE_GROUPS.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveGroup(group.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  activeGroup === group.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{group.emoji}</span>
                <span>{group.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
