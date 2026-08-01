import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Store, Loader2, Plus, Trash2, Send, BadgeCheck, Clock, Ban, PencilLine } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  MERCHANT_CATEGORIES, MERCHANT_STATUS_LABEL, DEAL_STATUS_LABEL,
  createDeal, createMerchant, deleteDeal, fetchMerchantDeals, fetchMyMerchant, updateDeal,
  type Merchant,
} from "@/lib/merchant-api";

export const Route = createFileRoute("/_authenticated/merchant")({
  head: () => ({
    meta: [
      { title: "بوابة التاجر — Hkeeem AI" },
      { name: "description", content: "سجّل متجرك في حكيم AI وأضف عروضك الحقيقية ليشاهدها آلاف المتسوقين." },
      { property: "og:title", content: "بوابة التاجر — Hkeeem AI" },
      { property: "og:description", content: "أضف عروض متجرك الحقيقية في حكيم AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MerchantPortal,
});

function MerchantPortal() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const merchantQ = useQuery({
    queryKey: ["my-merchant", user?.id],
    queryFn: () => fetchMyMerchant(user!.id),
    enabled: !!user?.id,
  });

  if (loading || merchantQ.isLoading) {
    return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;
  }

  const merchant = merchantQ.data;

  return (
    <main dir="rtl" className="max-w-4xl mx-auto px-4 pt-6 pb-24 space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-hero glow-gold grid place-items-center shrink-0">
          <Store className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl">بوابة التاجر</h1>
          <p className="text-xs text-muted-foreground">أضف عروضك الحقيقية وتابع حالة مراجعتها</p>
        </div>
      </header>

      {!merchant ? (
        <RegisterForm
          userId={user!.id}
          onDone={() => qc.invalidateQueries({ queryKey: ["my-merchant"] })}
        />
      ) : (
        <>
          <MerchantCard merchant={merchant} />
          {merchant.status === "verified" ? (
            <DealsManager merchantId={merchant.id} />
          ) : (
            <p className="text-sm text-muted-foreground bg-card border border-border rounded-2xl p-4">
              تقدر تضيف العروض بعد توثيق المتجر من فريق حكيم AI. عادةً تستغرق المراجعة وقت قصير.
            </p>
          )}
        </>
      )}
    </main>
  );
}

function MerchantCard({ merchant }: { merchant: Merchant }) {
  const Icon = merchant.status === "verified" ? BadgeCheck : merchant.status === "pending" ? Clock : Ban;
  const tone =
    merchant.status === "verified" ? "text-green-600 bg-green-500/10"
      : merchant.status === "pending" ? "text-primary bg-primary/10"
        : "text-destructive bg-destructive/10";
  return (
    <div className="bg-card border border-border rounded-3xl p-5 space-y-2 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-lg">{merchant.name}</h2>
        <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${tone}`}>
          <Icon className="w-3.5 h-3.5" /> {MERCHANT_STATUS_LABEL[merchant.status]}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{merchant.description || "بدون وصف"}</p>
      <p className="text-xs text-muted-foreground">
        {merchant.category}{merchant.city ? ` — ${merchant.city}` : ""}
      </p>
      {merchant.review_note && (
        <p className="text-xs text-destructive">ملاحظة الإدارة: {merchant.review_note}</p>
      )}
    </div>
  );
}

function RegisterForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [form, setForm] = useState({
    name: "", description: "", category: MERCHANT_CATEGORIES[0], city: "", cr_number: "", website: "", phone: "",
  });
  const m = useMutation({
    mutationFn: () => createMerchant({ owner_id: userId, ...form }),
    onSuccess: () => { toast.success("تم إرسال طلب التسجيل للمراجعة"); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (form.name.trim()) m.mutate(); }}
      className="bg-card border border-border rounded-3xl p-5 space-y-3 shadow-card"
    >
      <h2 className="font-bold">سجّل متجرك</h2>
      <Field label="اسم المتجر *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <div>
        <label className="text-xs font-bold text-muted-foreground">الفئة</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full mt-1 bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
        >
          {MERCHANT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <Field label="المدينة" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
      <Field label="السجل التجاري" value={form.cr_number} onChange={(v) => setForm({ ...form, cr_number: v })} />
      <Field label="رقم التواصل" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <Field label="الموقع الإلكتروني" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
      <Field label="نبذة عن المتجر" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
      <button
        type="submit"
        disabled={m.isPending || !form.name.trim()}
        className="w-full bg-gradient-hero text-primary-foreground rounded-2xl py-3 font-bold shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {m.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        إرسال طلب التوثيق
      </button>
    </form>
  );
}

const emptyDeal = {
  title: "", description: "", image_url: "", category: MERCHANT_CATEGORIES[0], unit: "",
  original_price: "", price: "", product_url: "", expires_at: "",
};

function DealsManager({ merchantId }: { merchantId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyDeal);
  const [open, setOpen] = useState(false);

  const dealsQ = useQuery({
    queryKey: ["merchant-deals", merchantId],
    queryFn: () => fetchMerchantDeals(merchantId),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["merchant-deals", merchantId] });

  const add = useMutation({
    mutationFn: (submit: boolean) => createDeal({
      merchant_id: merchantId,
      title: form.title.trim(),
      description: form.description || undefined,
      image_url: form.image_url || undefined,
      category: form.category,
      unit: form.unit || undefined,
      original_price: Number(form.original_price),
      price: Number(form.price),
      product_url: form.product_url || undefined,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      submit,
    }),
    onSuccess: () => { toast.success("تم حفظ العرض"); setForm(emptyDeal); setOpen(false); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitForReview = useMutation({
    mutationFn: (id: string) => updateDeal(id, { status: "pending" }),
    onSuccess: () => { toast.success("أرسلناه للمراجعة"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDeal(id),
    onSuccess: () => { toast.success("تم الحذف"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const valid = form.title.trim() && Number(form.original_price) > 0 && Number(form.price) >= 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">عروضي</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-sm font-bold bg-primary text-primary-foreground rounded-2xl px-4 py-2 press-ripple"
        >
          <Plus className="w-4 h-4" /> عرض جديد
        </button>
      </div>

      {open && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (valid) add.mutate(true); }}
          className="bg-card border border-border rounded-3xl p-5 space-y-3 shadow-card"
        >
          <Field label="اسم المنتج / العرض *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="السعر قبل الخصم *" value={form.original_price} onChange={(v) => setForm({ ...form, original_price: v })} type="number" />
            <Field label="السعر بعد الخصم *" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground">الفئة</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full mt-1 bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
              >
                {MERCHANT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Field label="الوحدة (كيلو، حبة...)" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} />
          </div>
          <Field label="ينتهي في" value={form.expires_at} onChange={(v) => setForm({ ...form, expires_at: v })} type="date" />
          <Field label="رابط صورة المنتج" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
          <Field label="رابط الشراء" value={form.product_url} onChange={(v) => setForm({ ...form, product_url: v })} />
          <Field label="وصف مختصر" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!valid || add.isPending}
              className="flex-1 bg-gradient-hero text-primary-foreground rounded-2xl py-3 font-bold shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              إرسال للمراجعة
            </button>
            <button
              type="button"
              disabled={!valid || add.isPending}
              onClick={() => add.mutate(false)}
              className="rounded-2xl px-4 py-3 text-sm font-bold bg-secondary text-secondary-foreground disabled:opacity-50"
            >
              حفظ كمسودة
            </button>
          </div>
        </form>
      )}

      {dealsQ.isLoading ? (
        <div className="py-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (dealsQ.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">ما أضفت أي عرض بعد.</p>
      ) : (
        <ul className="space-y-2">
          {dealsQ.data!.map((d) => (
            <li key={d.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              {d.image_url && <img src={d.image_url} alt={d.title} loading="lazy" className="w-12 h-12 rounded-xl object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{d.title}</p>
                <p className="text-xs text-muted-foreground">
                  {d.price} ر.س <span className="line-through opacity-60">{d.original_price}</span> · وفّر {d.discount_percent}%
                </p>
                <span className="text-[11px] font-bold text-primary">{DEAL_STATUS_LABEL[d.status]}</span>
                {d.review_note && <span className="block text-[11px] text-destructive">{d.review_note}</span>}
              </div>
              {(d.status === "draft" || d.status === "rejected") && (
                <button
                  onClick={() => submitForReview.mutate(d.id)}
                  className="text-xs font-bold text-primary flex items-center gap-1"
                  title="إرسال للمراجعة"
                >
                  <PencilLine className="w-4 h-4" /> مراجعة
                </button>
              )}
              <button onClick={() => remove.mutate(d.id)} className="text-destructive" title="حذف">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link to="/deals" className="block text-center text-xs text-primary hover:underline">
        شاهد كيف تظهر العروض للزبائن
      </Link>
    </section>
  );
}

function Field({
  label, value, onChange, type = "text", textarea,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full mt-1 bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-1 bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
        />
      )}
    </div>
  );
}
