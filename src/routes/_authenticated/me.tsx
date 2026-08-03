import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, BellRing, Wallet, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import {
  listFavorites, toggleFavorite,
  listMyAlerts, toggleAlert, deleteAlert,
  listMyCashback,
} from "@/lib/user.functions";
import { deals, getStore, discountPercent } from "@/data/deals";
import { useRealDeals } from "@/lib/real-deals";
import { ListSkeleton, StatsSkeleton } from "@/components/Skeletons";

type Tab = "favorites" | "alerts" | "cashback";

export const Route = createFileRoute("/_authenticated/me")({
  head: () => ({
    meta: [
      { title: "حسابي — Hkeeem AI" },
      { name: "description", content: "المفضلة، تنبيهات السعر، ومحفظة الكاش باك في حكيم AI." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MePage,
});

function MePage() {
  const [tab, setTab] = useState<Tab>("favorites");
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "favorites", label: "المفضلة", icon: Heart },
    { id: "alerts", label: "تنبيهات السعر", icon: BellRing },
    { id: "cashback", label: "الكاش باك", icon: Wallet },
  ];
  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="font-display font-black text-2xl md:text-3xl mb-4 text-gold-shine">حسابي</h1>
        <div className="flex gap-2 border-b border-primary/20 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition ${
                tab === t.id ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
        {tab === "favorites" && <FavoritesPanel />}
        {tab === "alerts" && <AlertsPanel />}
        {tab === "cashback" && <CashbackPanel />}
      </div>
    </div>
  );
}

function FavoritesPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my-favorites"], queryFn: () => listFavorites() });
  const rm = useMutation({
    mutationFn: (v: { itemType: any; itemId: string }) => toggleFavorite({ data: v }),
    onSuccess: () => { toast.success("تم"); qc.invalidateQueries({ queryKey: ["my-favorites"] }); },
  });
  if (q.isLoading) return <ListSkeleton count={4} grid />;
  const items = q.data ?? [];
  const dealFavs = items.filter((f: any) => f.item_type === "deal");
  if (dealFavs.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Heart className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>لا توجد عروض في مفضلتك بعد.</p>
        <Link to="/deals" className="inline-block mt-3 text-primary text-sm underline">تصفّح العروض</Link>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
      {dealFavs.map((f: any) => {
        const deal = deals.find((d) => d.id === f.item_id);
        if (!deal) return (
          <div key={f.id} className="p-4 rounded-xl border border-border/50 bg-card text-sm text-muted-foreground flex justify-between">
            <span>عرض غير متاح ({f.item_id})</span>
            <button onClick={() => rm.mutate({ itemType: f.item_type, itemId: f.item_id })}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
        const store = getStore(deal.storeId);
        return (
          <div key={f.id} className="p-4 rounded-2xl border border-primary/20 bg-card shadow-card hover-lift flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black" style={{ background: store.color }}>
              {store.logo}
            </div>
            <div className="flex-1 min-w-0">
              <Link to="/deals/$id" params={{ id: deal.id }} className="font-bold text-sm line-clamp-1 hover:text-primary">
                {deal.title}
              </Link>
              <p className="text-xs text-muted-foreground">{store.name}</p>
              <p className="text-primary font-bold text-sm mt-1">{deal.price} ر.س · −{discountPercent(deal)}٪</p>
            </div>
            <button
              onClick={() => rm.mutate({ itemType: "deal", itemId: deal.id })}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"
              aria-label="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AlertsPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my-alerts"], queryFn: () => listMyAlerts() });
  const tog = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => toggleAlert({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-alerts"] }),
  });
  const del = useMutation({
    mutationFn: (v: { id: string }) => deleteAlert({ data: v }),
    onSuccess: () => { toast.success("حُذف"); qc.invalidateQueries({ queryKey: ["my-alerts"] }); },
  });
  if (q.isLoading) return <ListSkeleton count={3} />;
  const items = q.data ?? [];
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BellRing className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>لا توجد تنبيهات سعر بعد.</p>
        <p className="text-xs mt-1">افتح أي عرض واضغط "تنبيه سعر" لتفعيله.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((a: any) => {
        const dropped = Number(a.current_price) > Number(a.target_price) && a.triggered_at;
        return (
          <div key={a.id} className="p-4 rounded-2xl border border-primary/20 bg-card shadow-card hover-lift flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <Link to="/deals/$id" params={{ id: a.deal_id }} className="font-bold text-sm line-clamp-1 hover:text-primary">
                {a.title}
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                الحالي: <b>{a.current_price} ر.س</b> · الهدف: <b className="text-primary">{a.target_price} ر.س</b>
              </p>
              {dropped && <p className="text-xs text-green-500 mt-1">✓ نزل السعر — تحقّق الآن</p>}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${a.active ? "bg-green-500/15 text-green-500" : "bg-muted text-muted-foreground"}`}>
              {a.active ? "مفعّل" : "متوقف"}
            </span>
            <button
              onClick={() => tog.mutate({ id: a.id, active: !a.active })}
              className="p-2 rounded-lg hover:bg-secondary"
              aria-label="تفعيل/إيقاف"
            >
              <Power className="w-4 h-4" />
            </button>
            <button
              onClick={() => del.mutate({ id: a.id })}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"
              aria-label="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function CashbackPanel() {
  const q = useQuery({ queryKey: ["my-cashback"], queryFn: () => listMyCashback() });
  if (q.isLoading) return (
    <div className="space-y-4">
      <StatsSkeleton />
      <ListSkeleton count={3} />
    </div>
  );
  const { transactions = [], totals } = q.data ?? { transactions: [], totals: { confirmed_total: 0, pending_total: 0, paid_total: 0, tx_count: 0 } };
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <StatBox label="مؤكّد" value={Number(totals.confirmed_total).toFixed(2)} gold />
        <StatBox label="بانتظار" value={Number(totals.pending_total).toFixed(2)} />
        <StatBox label="مدفوع" value={Number(totals.paid_total).toFixed(2)} />
      </div>
      {transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>لا توجد عمليات كاش باك بعد.</p>
          <p className="text-xs mt-1">من صفحة العرض اضغط "استرداد كاش باك" بعد الشراء.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((t: any) => {
            const store = getStore(t.store_id);
            return (
              <div key={t.id} className="p-4 rounded-2xl border border-primary/20 bg-card shadow-card hover-lift flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-black" style={{ background: store?.color ?? "#666" }}>
                  {store?.logo ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{store?.name ?? t.store_id}</p>
                  <p className="text-xs text-muted-foreground">
                    مبلغ الشراء: {t.purchase_amount} ر.س · {new Date(t.created_at).toLocaleDateString("ar-SA")}
                  </p>
                </div>
                <div className="text-primary font-bold">+{t.cashback_amount} ر.س</div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  t.status === "confirmed" ? "bg-blue-500/15 text-blue-500"
                  : t.status === "paid" ? "bg-green-500/15 text-green-500"
                  : t.status === "rejected" ? "bg-red-500/15 text-red-500"
                  : "bg-orange-500/15 text-orange-500"
                }`}>
                  {t.status === "confirmed" ? "مؤكد" : t.status === "paid" ? "مدفوع" : t.status === "rejected" ? "مرفوض" : "بانتظار"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border bg-card ${gold ? "border-primary/40 glow-gold" : "border-primary/20"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-black mt-1 ${gold ? "text-gold-shine" : "text-primary"}`}>{value} <span className="text-xs">ر.س</span></p>
    </div>
  );
}
