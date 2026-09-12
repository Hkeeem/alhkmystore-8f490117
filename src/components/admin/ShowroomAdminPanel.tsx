import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminDeleteShowroomOffer,
  adminListShowroomOffers,
  adminSaveShowroomOffer,
} from "@/lib/showcase.functions";

type Form = {
  id?: string;
  source_key: string;
  brand: string;
  title: string;
  description: string;
  image_url: string;
  offer_url: string;
  category: string;
  city: string;
  price: string;
  original_price: string;
  discount_percent: string;
  rank: string;
  active: boolean;
};
const empty: Form = {
  source_key: "manual:",
  brand: "",
  title: "",
  description: "",
  image_url: "",
  offer_url: "",
  category: "عام",
  city: "",
  price: "",
  original_price: "",
  discount_percent: "0",
  rank: "0",
  active: true,
};

export function ShowroomAdminPanel() {
  const client = useQueryClient();
  const list = useServerFn(adminListShowroomOffers);
  const save = useServerFn(adminSaveShowroomOffer);
  const remove = useServerFn(adminDeleteShowroomOffer);
  const [form, setForm] = useState<Form>(empty);
  const offers = useQuery({ queryKey: ["admin-showroom-offers"], queryFn: () => list({}) });
  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          ...form,
          price: form.price || undefined,
          original_price: form.original_price || undefined,
          discount_percent: Number(form.discount_percent),
          rank: Number(form.rank),
        },
      }),
    onSuccess: () => {
      toast.success("تم حفظ إعلان المعرض");
      setForm(empty);
      void client.invalidateQueries({ queryKey: ["admin-showroom-offers"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذر الحفظ"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف الإعلان");
      void client.invalidateQueries({ queryKey: ["admin-showroom-offers"] });
    },
    onError: () => toast.error("تعذر حذف الإعلان"),
  });
  const set = (key: keyof Form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <div dir="rtl" className="space-y-5">
      <div className="rounded-3xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">إضافة أو تعديل إعلان معرض حكيم</h2>
          <button
            type="button"
            onClick={() => setForm(empty)}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-2 text-xs font-bold"
          >
            <Plus className="h-4 w-4" /> جديد
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(
            [
              ["brand", "العلامة"],
              ["title", "العنوان"],
              ["source_key", "المفتاح المصدر"],
              ["category", "الفئة"],
              ["city", "المدينة"],
              ["image_url", "رابط الصورة"],
              ["offer_url", "رابط الإعلان"],
              ["price", "السعر"],
              ["original_price", "السعر السابق"],
              ["discount_percent", "نسبة الخصم"],
              ["rank", "الترتيب"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="space-y-1 text-xs font-bold">
              {label}
              <input
                value={String(form[key])}
                onChange={(e) => set(key, e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2"
              />
            </label>
          ))}
          <label className="space-y-1 text-xs font-bold md:col-span-2">
            الوصف
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-20 w-full rounded-xl border bg-background px-3 py-2"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
          />{" "}
          إعلان نشط
        </label>
        <button
          type="button"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="rounded-full bg-primary px-5 py-2 text-sm font-black text-primary-foreground"
        >
          {saveMutation.isPending ? "جارٍ الحفظ…" : "حفظ الإعلان"}
        </button>
      </div>
      <div className="overflow-x-auto rounded-3xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-xs text-muted-foreground">
            <tr>
              <th className="p-3 text-right">الإعلان</th>
              <th className="p-3">النقرات</th>
              <th className="p-3">التصفحات</th>
              <th className="p-3">الحالة</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(offers.data ?? []).map((row) => {
              const metrics = row as typeof row & { clicks?: number; page_views?: number };
              return (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="p-3">
                    <b>{row.title}</b>
                    <div className="text-xs text-muted-foreground">{row.brand}</div>
                  </td>
                  <td className="p-3 text-center">{metrics.clicks ?? 0}</td>
                  <td className="p-3 text-center">{metrics.page_views ?? 0}</td>
                  <td className="p-3 text-center">{row.active ? "نشط" : "مخفي"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        aria-label="تعديل"
                        onClick={() =>
                          setForm({
                            ...empty,
                            ...Object.fromEntries(
                              Object.entries(row).map(([k, v]) => [k, v ?? ""]),
                            ),
                          } as Form)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="حذف"
                        onClick={() => deleteMutation.mutate(row.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {offers.data?.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">لا توجد إعلانات بعد.</p>
        )}
      </div>
    </div>
  );
}
