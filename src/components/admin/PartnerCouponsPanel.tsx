import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  store_name: string;
  code: string;
  title: string;
  discount: string;
  store_url: string | null;
  expires_at: string | null;
  active: boolean;
};

const empty = { store_name: "", code: "", title: "", discount: "", store_url: "", expires_at: "", description: "" };

/** إضافة كوبونات حقيقية من المتاجر الشريكة وربط كل كود برابط المتجر */
export function PartnerCouponsPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const list = useQuery({
    queryKey: ["admin-partner-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("id,store_name,code,title,discount,store_url,expires_at,active")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.store_name || !form.code || !form.discount || !form.store_url) {
      toast.error("أكمل المتجر والكود والخصم ورابط المتجر");
      return;
    }
    try {
      new URL(form.store_url);
    } catch {
      toast.error("رابط المتجر غير صالح");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      store_name: form.store_name.trim(),
      store_id: form.store_name.trim().toLowerCase(),
      code: form.code.trim().toUpperCase(),
      title: form.title.trim() || `خصم ${form.discount} من ${form.store_name}`,
      description: form.description.trim() || `كود خصم من ${form.store_name}`,
      discount: form.discount.trim(),
      store_url: form.store_url.trim(),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      source: "متجر شريك",
      active: true,
    });
    setSaving(false);
    if (error) return toast.error("تعذّر الحفظ: " + error.message);
    toast.success("تمت إضافة الكوبون");
    setForm(empty);
    qc.invalidateQueries({ queryKey: ["admin-partner-coupons"] });
    qc.invalidateQueries({ queryKey: ["live-coupons"] });
  };

  const toggle = async (r: Row) => {
    const { error } = await supabase.from("coupons").update({ active: !r.active }).eq("id", r.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-partner-coupons"] });
  };

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const field = (k: keyof typeof empty, label: string, type = "text") => (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type={type}
        className={input}
        value={form[k]}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        dir={type === "url" || k === "code" ? "ltr" : undefined}
      />
    </label>
  );

  return (
    <div dir="rtl" className="space-y-6">
      <form onSubmit={save} className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-bold">إضافة كوبون من متجر شريك</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("store_name", "اسم المتجر *")}
          {field("code", "كود الخصم *")}
          {field("discount", "قيمة الخصم * (مثال 15% أو 30 ر.س)")}
          {field("store_url", "رابط المتجر *", "url")}
          {field("title", "العنوان (اختياري)")}
          {field("expires_at", "تاريخ الانتهاء", "date")}
        </div>
        {field("description", "الوصف (اختياري)")}
        <button
          disabled={saving}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ…" : "حفظ الكوبون"}
        </button>
      </form>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-bold mb-3">الكوبونات ({list.data?.length ?? 0})</h3>
        <ul className="divide-y divide-border text-sm">
          {(list.data ?? []).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
              <span className="font-mono font-bold">{r.code}</span>
              <span>{r.store_name}</span>
              <span className="text-muted-foreground">{r.discount}</span>
              {r.store_url ? (
                <a href={r.store_url} target="_blank" rel="noreferrer" className="text-primary underline">
                  رابط المتجر
                </a>
              ) : (
                <span className="text-muted-foreground">بدون رابط</span>
              )}
              <button onClick={() => toggle(r)} className="ms-auto rounded-lg border border-border px-3 py-1">
                {r.active ? "إيقاف" : "تفعيل"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
