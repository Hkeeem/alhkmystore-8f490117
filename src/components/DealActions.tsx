import { useEffect, useState } from "react";
import { Heart, BellRing, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import {
  toggleFavorite, listFavorites,
  upsertPriceAlert,
  logCashbackClaim,
} from "@/lib/user.functions";
import { type Deal } from "@/data/deals";

export function DealActions({ deal }: { deal: Deal }) {
  const { user } = useAuth();
  const toggleFav = useServerFn(toggleFavorite);
  const listFav = useServerFn(listFavorites);
  const upsertAlert = useServerFn(upsertPriceAlert);
  const logCashback = useServerFn(logCashbackClaim);

  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState<"fav" | "alert" | "cash" | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showCash, setShowCash] = useState(false);
  const [target, setTarget] = useState(Math.max(1, Math.round(deal.price * 0.9)));
  const [amount, setAmount] = useState(deal.price);

  useEffect(() => {
    if (!user) { setFav(false); return; }
    listFav().then((rows) => {
      setFav((rows ?? []).some((r: any) => r.item_type === "deal" && r.item_id === deal.id));
    }).catch(() => {});
  }, [user, deal.id, listFav]);

  if (!user) {
    return (
      <div className="flex flex-wrap gap-2">
        <Link to="/auth" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-sm">
          <Heart className="w-4 h-4" /> سجّل دخول لحفظ العرض
        </Link>
        <Link to="/auth" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-sm">
          <BellRing className="w-4 h-4" /> تنبيه انخفاض السعر
        </Link>
      </div>
    );
  }

  async function handleFav() {
    setBusy("fav");
    try {
      const r = await toggleFav({ data: { itemType: "deal", itemId: deal.id } });
      setFav(r.favorited);
      toast.success(r.favorited ? "أُضيف للمفضلة" : "أُزيل من المفضلة");
    } catch { toast.error("فشل"); } finally { setBusy(null); }
  }

  async function handleAlert() {
    if (target <= 0 || target >= deal.price) {
      toast.error("اختر سعراً أقل من السعر الحالي");
      return;
    }
    setBusy("alert");
    try {
      await upsertAlert({ data: {
        dealId: deal.id, productKey: deal.productKey ?? null,
        title: deal.title, currentPrice: deal.price, targetPrice: target,
      }});
      toast.success(`تم — بننبّهك إذا نزل السعر لـ ${target} ر.س`);
      setShowAlert(false);
    } catch { toast.error("فشل"); } finally { setBusy(null); }
  }

  async function handleCash() {
    if (amount <= 0) return toast.error("أدخل مبلغ صحيح");
    setBusy("cash");
    try {
      const r = await logCashback({ data: {
        storeId: deal.storeId, dealId: deal.id,
        purchaseAmount: amount, cashbackRate: 2.0, note: null,
      }});
      toast.success(`سُجّل الطلب — كاش باك ${r.amount} ر.س (بانتظار المراجعة)`);
      setShowCash(false);
    } catch { toast.error("فشل"); } finally { setBusy(null); }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleFav}
          disabled={busy === "fav"}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            fav ? "bg-red-500/15 text-red-500 border border-red-500/30" : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          {busy === "fav" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${fav ? "fill-current" : ""}`} />}
          {fav ? "في المفضلة" : "أضف للمفضلة"}
        </button>
        <button
          onClick={() => setShowAlert((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition"
        >
          <BellRing className="w-4 h-4" /> تنبيه سعر
        </button>
        <button
          onClick={() => setShowCash((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-gold text-secondary glow-gold"
        >
          <Wallet className="w-4 h-4" /> استرداد كاش باك
        </button>
      </div>

      {showAlert && (
        <div className="p-4 rounded-2xl border border-primary/20 bg-card space-y-3">
          <p className="text-sm text-muted-foreground">
            السعر الحالي <b className="text-primary">{deal.price} ر.س</b>. نبّهني إذا نزل إلى:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1} max={deal.price - 1}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-32 px-3 py-2 rounded-lg border bg-background"
            />
            <span className="text-sm text-muted-foreground">ر.س</span>
            <button onClick={handleAlert} disabled={busy === "alert"} className="mr-auto px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
              {busy === "alert" ? "جارٍ…" : "فعّل التنبيه"}
            </button>
          </div>
        </div>
      )}

      {showCash && (
        <div className="p-4 rounded-2xl border border-primary/20 bg-card space-y-3">
          <p className="text-sm text-muted-foreground">
            سجّل مبلغ شرائك من <b>{deal.storeId}</b> — كاش باك <b className="text-primary">2%</b> يُضاف لمحفظتك بعد المراجعة.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-32 px-3 py-2 rounded-lg border bg-background"
            />
            <span className="text-sm text-muted-foreground">ر.س</span>
            <button onClick={handleCash} disabled={busy === "cash"} className="mr-auto px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
              {busy === "cash" ? "جارٍ…" : "احسب كاش باك"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
