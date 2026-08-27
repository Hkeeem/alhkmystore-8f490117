import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, ExternalLink, RefreshCw, Store as StoreIcon } from "lucide-react";
import { getHkeeemCatalog } from "@/lib/hkeeem-catalog.functions";

const GENERIC_ERROR = "تعذر تحديث عروض حكيم حاليًا، حاول لاحقًا.";

export function HkeeemCatalogSection() {
  const fetchCatalog = useServerFn(getHkeeemCatalog);
  const [storeId, setStoreId] = useState<string | undefined>(undefined);

  const query = useQuery({
    queryKey: ["hkeeem-catalog"],
    queryFn: () => fetchCatalog({ data: { limit: 24 } }),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
  });

  const catalog = query.data;
  const stores = catalog?.stores ?? [];
  const offers = useMemo(() => {
    const list = catalog?.offers ?? [];
    if (!storeId) return list;
    const store = stores.find((s) => s.id === storeId);
    return list.filter(
      (o) => o.storeId === storeId || (store ? o.storeName === store.name : false),
    );
  }, [catalog, storeId, stores]);

  return (
    <section dir="rtl" className="space-y-4" aria-labelledby="hkeeem-catalog-title">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 id="hkeeem-catalog-title" className="font-display font-black text-lg flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-primary" /> عروض HkeeemAI المعتمدة
        </h2>
        <div className="flex items-center gap-2">
          {catalog?.stale && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground">
              نسخة محفوظة · {formatDateAr(catalog.lastUpdatedAt)}
            </span>
          )}
          <button
            onClick={() => query.refetch()}
            aria-label="تحديث عروض HkeeemAI المعتمدة"
            className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground font-bold press-ripple"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${query.isFetching ? "animate-spin" : ""}`} /> تحديث
          </button>
        </div>
      </div>

      {stores.length > 0 && (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" role="group" aria-label="تصفية حسب المتجر">
          <Chip active={!storeId} onClick={() => setStoreId(undefined)}>كل المتاجر</Chip>
          {stores.map((s) => (
            <Chip key={s.id} active={storeId === s.id} onClick={() => setStoreId(s.id)}>{s.name}</Chip>
          ))}
        </div>
      )}

      {query.isPending ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-3xl overflow-hidden">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <div role="alert" className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5 text-center space-y-3">
          <p className="text-sm font-bold text-destructive">{GENERIC_ERROR}</p>
          <button
            onClick={() => query.refetch()}
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-black press-ripple"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          لا توجد عروض معتمدة متاحة حاليًا.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {offers.map((o) => (
            <article key={o.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-card hover-lift flex flex-col">
              {o.imageUrl && (
                <img src={o.imageUrl} alt={o.title} loading="lazy" className="w-full aspect-[4/3] object-cover" />
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
                {o.discountPercent !== null && (
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full w-fit">
                    خصم {o.discountPercent}%
                  </span>
                )}
                {o.updatedAt && (
                  <p className="text-[10px] text-muted-foreground">آخر تحديث {formatDateAr(o.updatedAt)}</p>
                )}
                {o.purchaseUrl && (
                  <a
                    href={o.purchaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center justify-center gap-1 rounded-full bg-primary text-primary-foreground text-[11px] font-black px-3 py-2 press-ripple"
                  >
                    شراء مباشر <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {stores.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="font-display font-black text-base flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-primary" /> متاجر HkeeemAI
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {stores.map((s) => (
              <div key={s.id} className="rounded-2xl border border-border bg-card p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {s.logoUrl && <img src={s.logoUrl} alt={s.name} loading="lazy" className="w-7 h-7 rounded-lg object-contain bg-background" />}
                  <span className="font-bold text-xs">{s.name}</span>
                </div>
                {s.category && <span className="text-[10px] text-muted-foreground">{s.category}</span>}
                {s.description && <span className="text-[10px] text-muted-foreground line-clamp-2">{s.description}</span>}
                {s.websiteUrl && (
                  <a href={s.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary font-bold hover:underline">
                    الموقع الرسمي
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-bold border transition press-ripple ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

function formatDateAr(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}
