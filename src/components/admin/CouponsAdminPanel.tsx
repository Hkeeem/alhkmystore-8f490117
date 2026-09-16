import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Save, Ticket, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  adminDeleteCoupon,
  adminListCoupons,
  adminSaveCoupon,
  adminToggleCoupon,
  type AdminCoupon,
} from "@/lib/coupons-admin.functions";

type FormState = {
  id?: string;
  store_name: string;
  store_id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  min_order: string;
  category: string;
  expires_at: string;
  active: boolean;
};

const EMPTY: FormState = {
  store_name: "",
  store_id: "",
  code: "",
  title: "",
  description: "",
  discount: "",
  min_order: "",
  category: "",
  expires_at: "",
  active: true,
};

const CATEGORIES = ["تسوق", "مطاعم", "إلكترونيات", "أزياء", "صيدليات", "سفر", "خدمات"];

function toForm(c: AdminCoupon): FormState {
  return {
    id: c.id,
    store_name: c.store_name ?? "",
    store_id: c.store_id ?? "",
    code: c.code ?? "",
    title: c.title ?? "",
    description: c.description ?? "",
    discount: c.discount ?? "",
    min_order: c.min_order == null ? "" : String(c.min_order),
    category: c.category ?? "",
    expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
    active: c.active,
  };
}

export function CouponsAdminPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [open, setOpen] = useState(false);

  const listQ = useQuery({ queryKey: ["admin-coupons"], queryFn: () => adminListCoupons() });

  const saveFn = useServerFn(adminSaveCoupon);
  const toggleFn = useServerFn(adminToggleCoupon);
  const deleteFn = useServerFn(adminDeleteCoupon);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-coupons"] });

  const saveM = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          ...(form.id ? { id: form.id } : {}),
          store_name: form.store_name,
          store_id: form.store_id,
          code: form.code,
          title: form.title,
          description: form.description,
          discount: form.discount,
          min_order: form.min_order === "" ? null : Number(form.min_order),
          category: form.category,
          expires_at: form.expires_at,
          active: form.active,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "تم تحديث الكوبون" : "تمت إضافة الكوبون");
      setForm(EMPTY);
      setOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleM = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => toggleFn({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف الكوبون");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = listQ.data ?? [];
  const field =
    "w-full px-3 py-2 rounded-lg border border-primary/20 bg-background text-sm";

  return (
    <section dir="rtl" className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            إدارة الكوبونات
          </h2>
          <p className="text-sm text-muted-foreground">
            ارفع كوبونات حقيقية من المتاجر الشريكة بقيمة الخصم وتاريخ الانتهاء.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY);
            setOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          كوبون جديد
        </button>
      </header>

      {open && (
        <div className="rounded-2xl border border-primary/20 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">{form.id ? "تعديل كوبون" : "كوبون جديد"}</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              className={field}
              placeholder="اسم المتجر *"
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            />
            <input
              className={field}
              placeholder="معرّف المتجر (اختياري)"
              value={form.store_id}
              onChange={(e) => setForm({ ...form, store_id: e.target.value })}
            />
            <input
              className={`${field} font-mono`}
              placeholder="كود الكوبون *"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <input
              className={field}
              placeholder="عنوان العرض *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className={field}
              placeholder="قيمة الخصم مثل 15% أو 50 ر.س *"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
            />
            <input
              className={field}
              inputMode="numeric"
              placeholder="أقل قيمة للطلب (ر.س)"
              value={form.min_order}
              onChange={(e) => setForm({ ...form, min_order: e.target.value.replace(/\D/g, "") })}
            />
            <select
              className={field}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">التصنيف</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              className={field}
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm px-1">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              كوبون مفعّل
            </label>
            <textarea
              className={`${field} sm:col-span-2 lg:col-span-3`}
              rows={2}
              placeholder="وصف مختصر للكوبون وشروطه"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button
            onClick={() => saveM.mutate()}
            disabled={saveM.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60"
          >
            {saveM.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ الكوبون
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-primary/20 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="p-3 text-right font-bold">المتجر</th>
              <th className="p-3 text-right font-bold">الكود</th>
              <th className="p-3 text-right font-bold">العنوان</th>
              <th className="p-3 text-right font-bold">الخصم</th>
              <th className="p-3 text-right font-bold">التصنيف</th>
              <th className="p-3 text-right font-bold">ينتهي</th>
              <th className="p-3 text-right font-bold">الحالة</th>
              <th className="p-3 text-right font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {listQ.isLoading && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  جارٍ التحميل…
                </td>
              </tr>
            )}
            {!listQ.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  لا توجد كوبونات بعد — أضف أول كوبون من المتاجر الشريكة.
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border/60 hover:bg-muted/40">
                <td className="p-3 font-medium">{c.store_name}</td>
                <td className="p-3 font-mono text-primary">{c.code}</td>
                <td className="p-3 max-w-[240px] truncate">{c.title}</td>
                <td className="p-3 font-bold">{c.discount}</td>
                <td className="p-3">{c.category ?? "—"}</td>
                <td className="p-3 whitespace-nowrap">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString("ar-SA") : "—"}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleM.mutate({ id: c.id, active: !c.active })}
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      c.active
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.active ? "مفعّل" : "متوقف"}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setForm(toForm(c));
                        setOpen(true);
                      }}
                      className="text-primary hover:underline text-xs"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => deleteM.mutate(c.id)}
                      className="text-destructive hover:opacity-80"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
