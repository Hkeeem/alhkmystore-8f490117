import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, StarOff, Trash2, Save, Loader2, Bookmark } from "lucide-react";
import {
  listSavedFilters,
  saveFilter,
  deleteSavedFilter,
  setDefaultFilter,
  type SavedFilter,
} from "@/lib/saved-filters.functions";

type Filters = { days: number; country: string; referrer: string };

export function SavedFiltersBar({
  scope = "clicks",
  current,
  onApply,
}: {
  scope?: string;
  current: Filters;
  onApply: (f: Filters) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [appliedDefault, setAppliedDefault] = useState(false);

  const q = useQuery({
    queryKey: ["saved-filters", scope],
    queryFn: () => listSavedFilters({ data: { scope } }),
  });

  // تطبيق الفلتر الافتراضي تلقائيًا عند أول تحميل
  const items: Array<SavedFilter> = q.data ?? [];
  const def = items.find((i) => i.is_default);
  if (def && !appliedDefault) {
    setAppliedDefault(true);
    onApply(def.filters);
  }

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["saved-filters", scope] });

  const saveM = useMutation({
    mutationFn: (isDefault: boolean) =>
      saveFilter({ data: { scope, name, filters: current, isDefault } }),
    onSuccess: () => {
      setName("");
      toast.success("تم حفظ الفلتر");
      invalidate();
    },
    onError: (e: Error) =>
      toast.error(e.message === "forbidden" ? "هذه الميزة للمشرفين فقط" : e.message),
  });
  const delM = useMutation({
    mutationFn: (id: string) => deleteSavedFilter({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف الفلتر");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const defM = useMutation({
    mutationFn: (id: string) => setDefaultFilter({ data: { id, scope } }),
    onSuccess: () => {
      toast.success("تم تعيين الفلتر الافتراضي");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-4 rounded-2xl border border-primary/20 bg-card space-y-3">
      <div className="flex items-center gap-2">
        <Bookmark className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold">الفلاتر المفضّلة</h3>
        <span className="text-[11px] text-muted-foreground">خاصة بحسابك الإداري فقط</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الفلتر (مثال: السعودية آخر ٧ أيام)"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-background border border-primary/20 text-sm"
        />
        <button
          onClick={() => saveM.mutate(false)}
          disabled={!name.trim() || saveM.isPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
        >
          {saveM.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          حفظ الحالي
        </button>
        <button
          onClick={() => saveM.mutate(true)}
          disabled={!name.trim() || saveM.isPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/25 text-sm hover:bg-muted disabled:opacity-50"
        >
          <Star className="w-4 h-4" /> حفظ كافتراضي
        </button>
      </div>

      {q.isLoading ? (
        <p className="text-xs text-muted-foreground">جارٍ التحميل…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          لا توجد فلاتر محفوظة بعد — اضبط الفلاتر ثم احفظها لاستخدامها لاحقًا.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((f) => (
            <div
              key={f.id}
              className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
                f.is_default ? "border-primary/50 bg-primary/10" : "border-border"
              }`}
            >
              <button
                onClick={() => onApply(f.filters)}
                className="px-1 font-medium hover:text-primary"
              >
                {f.name}
              </button>
              <span className="text-muted-foreground">
                {f.filters.days}ي{f.filters.country ? ` • ${f.filters.country}` : ""}
              </span>
              <button
                onClick={() => defM.mutate(f.id)}
                title={f.is_default ? "الفلتر الافتراضي" : "تعيين كافتراضي"}
                className="text-primary/80 hover:text-primary"
              >
                {f.is_default ? (
                  <Star className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <StarOff className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => delM.mutate(f.id)}
                className="text-destructive/80 hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
