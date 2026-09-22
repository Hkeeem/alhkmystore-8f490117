import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BellPlus, LineChart as LineChartIcon, TrendingDown } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { fetchPriceHistory } from "@/lib/price-history";
import { upsertPriceAlert } from "@/lib/user.functions";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  dealId: string;
  productKey?: string | null;
  title: string;
  price: number;
}

/** رسم بياني لسعر آخر 30 يومًا + متابعة السعر */
export function PriceHistoryCard({ dealId, productKey, title, price }: Props) {
  const productId = productKey || dealId;
  const { user } = useAuth();
  const followPrice = useServerFn(upsertPriceAlert);
  const [target, setTarget] = useState(() => String(Math.max(1, Math.round(price * 0.9))));
  const [saving, setSaving] = useState(false);

  const { data: points = [] } = useQuery({
    queryKey: ["price-history", productId],
    queryFn: () => fetchPriceHistory(productId),
    staleTime: 5 * 60_000,
  });

  const history = points.length > 0 ? points : [{ date: "اليوم", price }];
  const lowest = Math.min(...history.map((p) => p.price));
  const isCheapest = points.length > 1 && price <= lowest + 0.005;

  async function handleFollow() {
    const value = Number(target);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("اكتب سعرًا صحيحًا");
      return;
    }
    setSaving(true);
    try {
      await followPrice({
        data: {
          dealId,
          productKey: productKey ?? null,
          title,
          currentPrice: price,
          targetPrice: value,
        },
      });
      toast.success(`بننبّهك لما ينزل السعر لـ ${value} ر.س`);
    } catch {
      toast.error("تعذّر حفظ التنبيه، جرّب مرة ثانية");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 font-display font-black text-base">
          <LineChartIcon className="w-4.5 h-4.5 text-primary" />
          تاريخ السعر (30 يوم)
        </h2>
        {isCheapest && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-black">
            <TrendingDown className="w-3.5 h-3.5" /> أرخص خلال 30 يوم
          </span>
        )}
      </div>

      <div className="h-44 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              width={44}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              domain={["auto", "auto"]}
            />
            <Tooltip
              formatter={(v: number | string) => [`${v} ر.س`, "السعر"]}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        أقل سعر مسجّل خلال 30 يوم: <strong className="text-foreground">{lowest} ر.س</strong>
        {points.length === 0 && " — نبدأ بتسجيل التغيّرات من اليوم."}
      </p>

      {user ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="flex-1 min-w-0 px-3.5 py-3 rounded-2xl bg-secondary border border-border/60 text-sm font-bold"
            placeholder="السعر المطلوب"
          />
          <button
            type="button"
            onClick={handleFollow}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gradient-hero text-primary-foreground px-4 py-3 rounded-2xl font-black text-sm disabled:opacity-60"
          >
            <BellPlus className="w-4 h-4" />
            تابع السعر
          </button>
        </div>
      ) : (
        <Link
          to="/auth"
          className="w-full inline-flex items-center justify-center gap-2 bg-card border border-primary/30 text-primary px-6 py-3 rounded-2xl font-black text-sm"
        >
          <BellPlus className="w-4 h-4" />
          سجّل الدخول لمتابعة السعر
        </Link>
      )}
    </div>
  );
}
