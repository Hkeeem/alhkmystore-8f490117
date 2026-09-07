import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Loader2, Check, X, Store } from "lucide-react";
import {
  DEAL_STATUS_LABEL, MERCHANT_STATUS_LABEL,
  staffListDeals, staffListMerchants, updateDeal, updateMerchant,
} from "@/lib/merchant-api";

export const Route = createFileRoute("/_authenticated/merchant-review")({
  head: () => ({
    meta: [
      { title: "مراجعة التجّار والعروض — Hkeeem AI" },
      { name: "description", content: "اعتماد التجّار ومراجعة العروض الحقيقية قبل نشرها في حكيم AI." },
      { property: "og:title", content: "مراجعة التجّار والعروض — Hkeeem AI" },
      { property: "og:description", content: "لوحة اعتماد التجّار والعروض في حكيم AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"merchants" | "deals">("merchants");

  const merchantsQ = useQuery({ queryKey: ["staff-merchants"], queryFn: staffListMerchants });
  const dealsQ = useQuery({ queryKey: ["staff-merchant-deals"], queryFn: staffListDeals });

  const setMerchantStatus = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: "verified" | "rejected" | "suspended"; note?: string }) =>
      updateMerchant(id, { status, review_note: note ?? null }),
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["staff-merchants"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setDealStatus = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: "published" | "rejected"; note?: string }) =>
      updateDeal(id, { status, review_note: note ?? null }),
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["staff-merchant-deals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main dir="rtl" className="max-w-4xl mx-auto px-4 pt-6 pb-24 space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="font-display font-black text-xl">مراجعة التجّار والعروض</h1>
        </div>
        <Link to="/admin" className="text-sm text-primary hover:underline">لوحة التحكم</Link>
      </header>

      <div className="flex gap-2">
        {([["merchants", "التجّار"], ["deals", "العروض"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-2xl text-sm font-bold transition ${tab === id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "merchants" ? (
        merchantsQ.isLoading ? <Spinner /> : (
          <ul className="space-y-2">
            {(merchantsQ.data ?? []).map((m) => (
              <li key={m.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <Store className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.category}{m.city ? ` — ${m.city}` : ""}{m.cr_number ? ` — س.ت ${m.cr_number}` : ""}
                  </p>
                  <span className="text-[11px] font-bold text-primary">{MERCHANT_STATUS_LABEL[m.status]}</span>
                </div>
                <button
                  onClick={() => setMerchantStatus.mutate({ id: m.id, status: "verified" })}
                  className="text-green-600" title="توثيق"
                ><Check className="w-5 h-5" /></button>
                <button
                  onClick={() => setMerchantStatus.mutate({ id: m.id, status: "rejected", note: "لم تستوفِ الشروط" })}
                  className="text-destructive" title="رفض"
                ><X className="w-5 h-5" /></button>
              </li>
            ))}
            {(merchantsQ.data ?? []).length === 0 && <Empty text="لا يوجد تجّار حالياً." />}
          </ul>
        )
      ) : (
        dealsQ.isLoading ? <Spinner /> : (
          <ul className="space-y-2">
            {(dealsQ.data ?? []).map((d) => (
              <li key={d.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                {d.image_url && <img src={d.image_url} alt={d.title} loading="lazy" className="w-12 h-12 rounded-xl object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {d.merchants?.name ?? "—"} · {d.price} ر.س · وفّر {d.discount_percent}%
                  </p>
                  <span className="text-[11px] font-bold text-primary">{DEAL_STATUS_LABEL[d.status]}</span>
                  {d.coupon_code && (
                    <span className="mr-2 text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      كود: {d.coupon_code}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setDealStatus.mutate({ id: d.id, status: "published" })}
                  className="text-green-600" title="نشر"
                ><Check className="w-5 h-5" /></button>
                <button
                  onClick={() => setDealStatus.mutate({ id: d.id, status: "rejected", note: "يحتاج تعديل" })}
                  className="text-destructive" title="رفض"
                ><X className="w-5 h-5" /></button>
              </li>
            ))}
            {(dealsQ.data ?? []).length === 0 && <Empty text="لا توجد عروض للمراجعة." />}
          </ul>
        )
      )}
    </main>
  );
}

const Spinner = () => (
  <div className="py-14 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
);
const Empty = ({ text }: { text: string }) => (
  <p className="text-sm text-muted-foreground text-center py-10">{text}</p>
);
