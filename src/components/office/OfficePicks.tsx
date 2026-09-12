import { useQuery } from "@tanstack/react-query";
import { Building2, BadgeCheck, ExternalLink } from "lucide-react";
import { fetchOfficePicks, type OfficePick } from "@/lib/showcase";

function PicksList({
  kind,
  title,
  icon,
  emptyText,
}: {
  kind: "property" | "developer";
  title: string;
  icon: React.ReactNode;
  emptyText: string;
}) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["office-picks", kind],
    queryFn: () => fetchOfficePicks(kind, 5),
    staleTime: 60_000,
  });

  return (
    <section className="bg-card rounded-3xl border border-border/60 shadow-card p-4" dir="rtl">
      <h2 className="flex items-center gap-2 font-black text-base mb-3 text-foreground">
        {icon}
        {title}
      </h2>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center space-y-2 py-4">
          <p className="text-sm">تعذّر تحميل البيانات.</p>
          <button
            onClick={() => refetch()}
            className="text-xs font-bold rounded-xl bg-primary/10 border border-primary/30 text-primary px-3 py-1.5"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">{emptyText}</p>
      )}

      <ul className="divide-y divide-border/50 list-none m-0 p-0">
        {(data ?? []).map((p: OfficePick) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5">
            <span className="w-7 h-7 shrink-0 rounded-lg bg-secondary text-primary flex items-center justify-center text-xs font-black">
              {p.rank}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{p.title}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {[p.subtitle, p.city].filter(Boolean).join(" · ")}
              </div>
            </div>
            {p.price !== null && (
              <span className="font-display font-black text-sm text-gold-shine shrink-0">
                {p.price} ر.س
              </span>
            )}
            {p.link_url && (
              <a
                href={p.link_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`فتح ${p.title}`}
                className="shrink-0 text-primary"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OfficePicks() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <PicksList
        kind="property"
        title="أفضل 5 عقارات مختارة"
        icon={<Building2 className="w-4 h-4 text-primary" />}
        emptyText="لا توجد عقارات مختارة حالياً."
      />
      <PicksList
        kind="developer"
        title="أفضل 5 مطوّرين معتمدين"
        icon={<BadgeCheck className="w-4 h-4 text-primary" />}
        emptyText="لا يوجد مطوّرون معتمدون حالياً."
      />
    </div>
  );
}
