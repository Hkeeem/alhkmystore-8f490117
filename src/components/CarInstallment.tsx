import { useState } from "react";

/** Flat-rate monthly installment (common in Saudi car financing). */
export function monthlyInstallment(price: number, downPct = 10, years = 5, flatRate = 4.5) {
  const principal = price * (1 - downPct / 100);
  const total = principal * (1 + (flatRate / 100) * years);
  return Math.round(total / (years * 12));
}

const riyal = (n: number) => `${n.toLocaleString("ar-SA")} ر.س`;

export function CarInstallment({ price }: { price: number }) {
  const [down, setDown] = useState(10);
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(4.5);
  const monthly = monthlyInstallment(price, down, years, rate);

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">القسط الشهري التقديري</p>
      <p className="text-2xl font-black text-primary">{riyal(monthly)} <span className="text-sm font-medium text-muted-foreground">/ شهريًا</span></p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <label className="flex flex-col gap-1">
          الدفعة الأولى
          <select value={down} onChange={(e) => setDown(+e.target.value)} className="rounded-lg border border-border bg-background p-2">
            {[0, 10, 20, 30].map((v) => <option key={v} value={v}>{v}%</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          المدة
          <select value={years} onChange={(e) => setYears(+e.target.value)} className="rounded-lg border border-border bg-background p-2">
            {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v} سنوات</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          نسبة الربح
          <select value={rate} onChange={(e) => setRate(+e.target.value)} className="rounded-lg border border-border bg-background p-2">
            {[3, 3.5, 4, 4.5, 5, 6].map((v) => <option key={v} value={v}>{v}%</option>)}
          </select>
        </label>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">تقدير بنسبة ربح ثابتة سنويًا؛ القسط الفعلي يحدده البنك أو جهة التمويل.</p>
    </div>
  );
}
