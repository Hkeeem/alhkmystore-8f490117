import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, RefreshCw, ExternalLink, Store as StoreIcon, CheckCircle2, XCircle } from "lucide-react";
import { getHkeeemOffers, getHkeeemStores, getHkeeemIntegrationStatus } from "@/lib/hkeeem-offers.functions";
import { STORES_DIRECTORY } from "@/data/hkeeem-stores-directory";
import { HkeeemStatusPanel } from "@/components/HkeeemStatusPanel";

type Filters = { category?: string; platform?: string; storeId?: string; minDiscount?: number };

const DISCOUNT_STEPS = [20, 30, 50, 70];

export function HkeeemOffersSection() {
  const fetchOffers = useServerFn(getHkeeemOffers);
  const fetchStores = useServerFn(getHkeeemStores);
  const [filters, setFilters] = useState<Filters>({});

  const offersQuery = useQuery({
    queryKey: ["hkeeem-offers", filters],
    queryFn: () => fetchOffers({ data: filters }),
    staleTime: 5 * 60_000,
    // تحديث دوري تلقائي كل ٥ دقائق للعروض والكوبونات
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
  });

  const storesQuery = useQuery({
    queryKey: ["hkeeem-stores"],
    queryFn: () => fetchStores({}),
    staleTime: 5 * 60_000,
    refetchInterval: 15 * 60_000,
  });

  const fetchStatus = useServerFn(getHkeeemIntegrationStatus);
  const statusQuery = useQuery({
    queryKey: ["hkeeem-status"],
    queryFn: () => fetchStatus({}),
    refetchInterval: 60_000,
  });

  const offers = offersQuery.data ?? [];
  const status = statusQuery.data;
  const lastSuccess = status?.lastSuccessAt ? new Date(status.lastSuccessAt).getTime() : null;
  const lastFailure = status?.lastFailureAt ? new Date(status.lastFailureAt).getTime() : null;
  const isAvailable =
    !offersQuery.isError && (offers.length > 0 || (lastSuccess !== null && (lastFailure === null || lastSuccess >= lastFailure)));
  const lastSuccessLabel =
    status?.lastSuccessAt && !Number.isNaN(new Date(status.lastSuccessAt).getTime())
      ? new Date(status.lastSuccessAt).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })
      : "لا يوجد";
  const statusAnnouncement = `حالة مزامنة عروض HkeeemAI: ${isAvailable ? "متاح" : "غير متاح"}. آخر مزامنة ناجحة: ${
    statusQuery.isPending ? "جارٍ التحقق" : lastSuccessLabel
  }`;


  const categories = useMemo(
    () => Array.from(new Set(offers.map((o) => o.category).filter(Boolean))) as string[],
    [offers],
  );
  const platforms = useMemo(
    () => Array.from(new Set(offers.map((o) => o.platform).filter(Boolean))) as string[],
    [offers],
  );

  const set = (key: keyof Filters, value?: string | number) =>
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? undefined : value }));

  return (
    <section dir="rtl" className="space-y-3" aria-labelledby="hkeeem-offers-title">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 id="hkeeem-offers-title" className="font-display font-black text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> عروض HkeeemAI الذكية
        </h2>
        <button
          onClick={() => offersQuery.refetch()}
          className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground font-bold press-ripple"
          aria-label="تحديث عروض HkeeemAI الذكية"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${offersQuery.isFetching ? "animate-spin" : ""}`} /> تحديث
        </button>
      </div>

      {/* إعلان مباشر لقارئات الشاشة فقط (بدون تشتت بصري) */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusAnnouncement}
      </p>

      {/* شارة حالة المزامنة */}
      <div
        tabIndex={0}
        role="group"
        aria-label={statusAnnouncement}
        title={statusAnnouncement}
        className={`flex items-center gap-2 flex-wrap rounded-2xl border px-3 py-2 text-[11px] font-bold outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          isAvailable ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"
        }`}
      >
        {isAvailable ? (
          <CheckCircle2 className="w-4 h-4 text-primary" aria-hidden="true" />
        ) : (
          <XCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
        )}
        <span aria-hidden="true">{isAvailable ? "متاح" : "غير متاح"}</span>
        <span className="text-muted-foreground font-medium" aria-hidden="true">
          · آخر مزامنة ناجحة: {statusQuery.isPending ? "…" : lastSuccessLabel}
        </span>
      </div>


      {/* الفلاتر */}
      <div className="space-y-2">
        {categories.length > 0 && (
          <FilterRow label="الفئة">
            {categories.map((c) => (
              <FilterChip key={c} active={filters.category === c} onClick={() => set("category", c)}>{c}</FilterChip>
            ))}
          </FilterRow>
        )}
        {platforms.length > 0 && (
          <FilterRow label="المنصة">
            {platforms.map((p) => (
              <FilterChip key={p} active={filters.platform === p} onClick={() => set("platform", p)}>{p}</FilterChip>
            ))}
          </FilterRow>
        )}
        {(storesQuery.data?.length ?? 0) > 0 && (
          <FilterRow label="المتجر">
            {storesQuery.data!.map((s) => (
              <FilterChip key={s.id} active={filters.storeId === s.id} onClick={() => set("storeId", s.id)}>{s.name}</FilterChip>
            ))}
          </FilterRow>
        )}
        <FilterRow label="نسبة الخصم">
          {DISCOUNT_STEPS.map((d) => (
            <FilterChip key={d} active={filters.minDiscount === d} onClick={() => set("minDiscount", d)}>
              {d}%+
            </FilterChip>
          ))}
        </FilterRow>
      </div>

      {offersQuery.isPending ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-3xl overflow-hidden">
              <div className="h-28 bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : offersQuery.isError ? (
        <div role="alert" className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5 text-center space-y-3">
          <p className="text-sm font-bold text-destructive">تعذّر جلب عروض HkeeemAI الآن.</p>
          <button
            onClick={() => offersQuery.refetch()}
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-black press-ripple"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          لا توجد عروض مطابقة حالياً من منصة HkeeemAI.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {offers.map((o) => (
            <article key={o.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-card hover-lift flex flex-col">
              {o.imageUrl && (
                <img src={o.imageUrl} alt={o.title} loading="lazy" className="w-full h-28 object-cover" />
              )}
              <div className="p-3 space-y-1 flex-1 flex flex-col">
                <p className="font-bold text-sm line-clamp-2">{o.title}</p>
                {o.storeName && <p className="text-[11px] text-muted-foreground">{o.storeName}</p>}
                <p className="text-sm font-black text-primary">
                  {o.price !== null ? `${o.price} ر.س` : ""}{" "}
                  {o.originalPrice !== null && (
                    <span className="text-[11px] font-normal text-muted-foreground line-through">{o.originalPrice}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1">
                  {o.discountPercent !== null && (
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      خصم {o.discountPercent}%
                    </span>
                  )}
                  {o.savingsScore !== null && (
                    <span className="text-[10px] font-bold bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      درجة التوفير {o.savingsScore}
                    </span>
                  )}
                  {o.category && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{o.category}</span>
                  )}
                  {o.platform && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{o.platform}</span>
                  )}
                </div>
                {(o.sourceUrl || o.updatedAt) && (
                  <p className="text-[10px] text-muted-foreground">
                    {o.sourceUrl && (
                      <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        المصدر الرسمي
                      </a>
                    )}
                    {o.sourceUrl && o.updatedAt ? " · " : ""}
                    {o.updatedAt && <span>آخر تحديث {formatDateAr(o.updatedAt)}</span>}
                  </p>
                )}
                <a
                  href={o.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-1 rounded-full bg-primary text-primary-foreground text-[11px] font-black px-3 py-2 press-ripple"
                >
                  شراء مباشر <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      <HkeeemStatusPanel refreshKey={offersQuery.dataUpdatedAt + offersQuery.errorUpdatedAt} />

      <StoresDirectory offerStoreNames={offers.map((o) => o.storeName ?? "")} />

    </section>
  );
}

function formatDateAr(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

/** دليل المتاجر الرسمية — روابط رسمية فقط دون أكواد أو أسعار مُختلقة */
export function StoresDirectory({ offerStoreNames = [] }: { offerStoreNames?: string[] }) {
  const names = useMemo(() => new Set(offerStoreNames.filter(Boolean)), [offerStoreNames]);

  return (
    <div className="space-y-2 pt-2">
      <h3 className="font-display font-black text-base flex items-center gap-2">
        <StoreIcon className="w-4 h-4 text-primary" /> دليل المتاجر الرسمية
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {STORES_DIRECTORY.map((s) => {
          const hasOffers = names.has(s.name);
          return (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl border border-border/70 bg-card/80 p-2 pr-2 hover:border-primary transition-colors flex items-center gap-2 min-h-[54px]"
            >
              <span
                aria-hidden
                className="hex-tile w-8 h-9 shrink-0 text-primary font-black text-sm leading-none"
              >
                {s.name.trim().charAt(0)}
              </span>
              <span className="flex flex-col gap-0 min-w-0 flex-1">
                <span className="font-bold text-[13px] leading-tight line-clamp-1 text-foreground">{s.name}</span>
                <span className="text-xs text-primary font-bold">{s.category}</span>
                <span className="text-xs text-muted-foreground font-medium">{s.region}</span>
                {!hasOffers && (
                  <span className="text-xs text-muted-foreground font-medium">لا توجد عروض موثقة حاليًا</span>
                )}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-primary/70 shrink-0 self-center group-hover:text-primary transition-colors" />
            </a>
          );
        })}
      </div>

    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-center overflow-x-auto -mx-4 px-4 pb-1">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}:</span>
      {children}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition press-ripple ${active ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:border-primary"}`}
    >
      {children}
    </button>
  );
}
