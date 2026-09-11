import { Cpu, ShoppingBag } from "lucide-react";

export const DEAL_FILTERS = [
  "الكل",
  "إلكترونيات",
  "سوبرماركت",
  "أرخص اليوم",
  "أكبر توفير",
] as const;
export type DealFilter = (typeof DEAL_FILTERS)[number];

export function DealsFilter({
  activeFilter,
  onChange,
}: {
  activeFilter: DealFilter;
  onChange: (f: DealFilter) => void;
}) {
  return (
    <div
      dir="rtl"
      className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1"
      role="group"
      aria-label="تصفية العروض"
    >
      {DEAL_FILTERS.map((f) => {
        const active = activeFilter === f;
        return (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            aria-pressed={active}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${
              active
                ? "bg-[#5B21B6] text-white border-[#5B21B6] shadow"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}

export type Interest = "electronics" | "grocery";

export function InterestToggle({
  interest,
  onChange,
}: {
  interest: Interest;
  onChange: (i: Interest) => void;
}) {
  const options: { key: Interest; label: string; Icon: typeof Cpu }[] = [
    { key: "electronics", label: "إلكترونيات", Icon: Cpu },
    { key: "grocery", label: "بقالة", Icon: ShoppingBag },
  ];

  return (
    <div
      dir="rtl"
      className="bg-zinc-100 rounded-full p-1 flex w-fit"
      role="group"
      aria-label="اهتماماتي"
    >
      {options.map(({ key, label, Icon }) => {
        const active = interest === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
              active ? "bg-white shadow text-zinc-900" : "text-zinc-500"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
