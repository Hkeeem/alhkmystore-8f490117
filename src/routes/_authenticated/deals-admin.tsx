import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, PlusCircle, RefreshCw, CalendarClock, Tags } from "lucide-react";
import {
  DEAL_STATUS_LABEL,
  MERCHANT_CATEGORIES,
  staffCreateDeal,
  staffListDeals,
  staffListMerchants,
  staffUpdateDealDates,
  updateDeal,
  type DealStatus,
} from "@/lib/merchant-api";
import { runExternalSyncNow } from "@/lib/affiliate-setup.functions";
import { REAL_DEALS_KEY } from "@/hooks/use-real-deals";

export const Route = createFileRoute("/_authenticated/deals-admin")({
  head: () => ({
    meta: [
      { title: "لوحة عروض التجّار — Hkeeem AI" },
      { name: "description", content: "إضافة عروض التجّار يدوياً وتعديل تواريخها وربطها بمزامنة نون." },
      { property: "og:title", content: "لوحة عروض التجّار — Hkeeem AI" },
      { property: "og:description", content: "إدارة عروض التجّار وتواريخها ومزامنة نون في حكيم AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DealsAdminPage,
});

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function DealsAdminPage() {
  const qc = useQueryClient();
  const runSync = useServerFn(runExternalSyncNow);
  const [syncing, setSyncing] = useState(false);

  const merchantsQ = useQuery({ queryKey: ["staff-merchants"], queryFn: staffListMerchants });
  const dealsQ = useQuery({ queryKey: ["staff-merchant-deals"], queryFn: staffListDeals });

  const merchants = useMemo(() => merchantsQ.data ?? [], [merchantsQ.data]);

  const [form, setForm] = useState({
    merchant_id: "",
    title: "",
    description: "",
    image_url: "",
    category: MERCHANT_CATEGORIES[0] ?? "أخرى",
    original_price: "",
    price: "",
    product_url: "",
    coupon_code: "",
    starts_at: "",
    expires_at: "",
    status: "published" as DealStatus,
  });

  const invalidateDeals = async () => {
    await qc.invalidateQueries({ queryKey: ["staff-merchant-deals"] });
    await qc.invalidateQueries({ queryKey: REAL_DEALS_KEY, refetchType: "all" });
    await qc.invalidateQueries({ queryKey: ["published-merchant-deals"], refetchType: "all" });
  };

  const createM = useMutation({
    mutationFn: async () => {
      if (!form.merchant_id) throw new Error("اختر التاجر أولاً");
      if (!form.title.trim()) throw new Error("اكتب عنوان العرض");
      const price = Number(form.price);
      const original = Number(form.original_price);
      if (!Number.isFinite(price) || price <= 0) throw new Error("سعر العرض غير صحيح");
      if (!Number.isFinite(original) || original < price) throw new Error("السعر الأصلي يجب أن يكون أعلى من سعر العرض");
      await staffCreateDeal({
        merchant_id: form.merchant_id,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
        category: form.category,
        original_price: original,
        price,
        product_url: form.product_url.trim() || undefined,
        coupon_code: form.coupon_code.trim().toUpperCase() || undefined,
        starts_at: fromLocalInput(form.starts_at),
        expires_at: fromLocalInput(form.expires_at),
        status: form.status,
      });
    },
    onSuccess: async () => {
      toast.success("تمت إضافة العرض");
      setForm((f) => ({ ...f, title: "", description: "", image_url: "", original_price: "", price: "", product_url: "", coupon_code: "" }));
      await invalidateDeals();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const datesM = useMutation({
    mutationFn: ({ id, starts_at, expires_at }: { id: string; starts_at: string; expires_at: string }) =>
      staffUpdateDealDates(id, { starts_at: fromLocalInput(starts_at), expires_at: fromLocalInput(expires_at) }),
    onSuccess: async () => { toast.success("تم تحديث التواريخ"); await invalidateDeals(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DealStatus }) => updateDeal(id, { status }),
    onSuccess: async () => { toast.success("تم تحديث الحالة"); await invalidateDeals(); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function syncNoon() {
    setSyncing(true);
    try {
      const res = await runSync({ data: { source: "noon" } });
      if (res?.success) toast.success(`تمت مزامنة ${res.sources.noon} عرضاً من نون`);
      else toast.message("تعذّر جلب عروض نون الآن — عُرضت آخر العروض المحفوظة");
    } catch {
      toast.message("مزامنة نون متوقفة مؤقتاً");
    } finally {
      setSyncing(false);
      await invalidateDeals();
    }
  }

  const input = "w-full rounded-xl border border-primary/20 bg-background/70 px-3 py-2 text-sm";

  return (
    <main dir="rtl" className="max-w-4xl mx-auto px-4 pt-6 pb-24 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tags className="w-6 h-6 text-primary" />
          <h1 className="font-display font-black text-xl">لوحة عروض التجّار</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={syncNoon}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary px-3 py-2 text-xs font-bold disabled:opacity-60"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            مزامنة نون الآن
          </button>
          <Link to="/sync-log" className="text-sm text-primary hover:underline">سجل المزامنة</Link>
        </div>
      </header>

      {/* إضافة عرض يدوي */}
      <section className="rounded-2xl border border-primary/15 bg-card/60 p-4 space-y-3">
        <h2 className="flex items-center gap-2 font-bold text-sm">
          <PlusCircle className="w-4 h-4 text-primary" /> إضافة عرض يدوي
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={input} value={form.merchant_id} onChange={(e) => setForm({ ...form, merchant_id: e.target.value })}>
            <option value="">اختر التاجر…</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {MERCHANT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className={input} placeholder="عنوان العرض" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className={input} placeholder="رابط الصورة" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <input className={input} inputMode="decimal" placeholder="السعر الأصلي" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} />
          <input className={input} inputMode="decimal" placeholder="سعر العرض" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className={input} placeholder="رابط المنتج" value={form.product_url} onChange={(e) => setForm({ ...form, product_url: e.target.value })} />
          <input className={input} placeholder="كود الخصم (اختياري)" value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value })} />
          <label className="text-xs text-muted-foreground">
            يبدأ في
            <input type="datetime-local" className={input} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </label>
          <label className="text-xs text-muted-foreground">
            ينتهي في
            <input type="datetime-local" className={input} value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </label>
          <textarea className={input + " sm:col-span-2"} rows={2} placeholder="وصف مختصر" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={input + " max-w-[180px]"} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DealStatus })}>
            {(["published", "pending", "draft"] as DealStatus[]).map((s) => (
              <option key={s} value={s}>{DEAL_STATUS_LABEL[s]}</option>
            ))}
          </select>
          <button
            onClick={() => createM.mutate()}
            disabled={createM.isPending}
            className="rounded-xl bg-gradient-gold text-secondary px-4 py-2 text-sm font-bold disabled:opacity-60"
          >
            {createM.isPending ? "جارٍ الحفظ…" : "حفظ العرض"}
          </button>
          {merchants.length === 0 && !merchantsQ.isLoading && (
            <span className="text-xs text-muted-foreground">لا يوجد تجّار مسجّلون بعد.</span>
          )}
        </div>
      </section>

      {/* العروض الحالية وتعديل تواريخها */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 font-bold text-sm">
          <CalendarClock className="w-4 h-4 text-primary" /> تعديل تواريخ العروض
        </h2>
        {dealsQ.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : dealsQ.isError ? (
          <p className="text-sm text-destructive">تعذّر تحميل العروض.</p>
        ) : (dealsQ.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد عروض بعد.</p>
        ) : (
          <ul className="space-y-2">
            {(dealsQ.data ?? []).map((d) => (
              <DealRow
                key={d.id}
                id={d.id}
                title={d.title}
                merchant={d.merchants?.name ?? "—"}
                price={d.price}
                status={d.status}
                startsAt={d.starts_at}
                expiresAt={d.expires_at}
                onSaveDates={(starts_at, expires_at) => datesM.mutate({ id: d.id, starts_at, expires_at })}
                onStatus={(status) => statusM.mutate({ id: d.id, status })}
                saving={datesM.isPending || statusM.isPending}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function DealRow(props: {
  id: string;
  title: string;
  merchant: string;
  price: number;
  status: DealStatus;
  startsAt: string | null;
  expiresAt: string | null;
  onSaveDates: (starts: string, expires: string) => void;
  onStatus: (status: DealStatus) => void;
  saving: boolean;
}) {
  const [starts, setStarts] = useState(toLocalInput(props.startsAt));
  const [expires, setExpires] = useState(toLocalInput(props.expiresAt));
  const input = "rounded-lg border border-primary/20 bg-background/70 px-2 py-1.5 text-xs";

  return (
    <li className="rounded-2xl border border-primary/15 bg-card/60 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{props.title}</p>
          <p className="text-xs text-muted-foreground truncate">{props.merchant} · {props.price} ر.س</p>
        </div>
        <span className="shrink-0 text-[11px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-bold">
          {DEAL_STATUS_LABEL[props.status]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-muted-foreground">يبدأ
          <input type="datetime-local" className={input + " w-full"} value={starts} onChange={(e) => setStarts(e.target.value)} />
        </label>
        <label className="text-[11px] text-muted-foreground">ينتهي
          <input type="datetime-local" className={input + " w-full"} value={expires} onChange={(e) => setExpires(e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => props.onSaveDates(starts, expires)}
          disabled={props.saving}
          className="rounded-lg bg-primary/10 border border-primary/30 text-primary px-3 py-1.5 text-xs font-bold disabled:opacity-60"
        >
          حفظ التواريخ
        </button>
        {props.status !== "published" && (
          <button onClick={() => props.onStatus("published")} disabled={props.saving} className="rounded-lg bg-gradient-gold text-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-60">نشر</button>
        )}
        {props.status === "published" && (
          <button onClick={() => props.onStatus("draft")} disabled={props.saving} className="rounded-lg bg-secondary/60 px-3 py-1.5 text-xs font-bold disabled:opacity-60">إيقاف</button>
        )}
      </div>
    </li>
  );
}
