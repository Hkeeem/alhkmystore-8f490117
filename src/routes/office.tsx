import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, ExternalLink, RefreshCw } from "lucide-react";
import { getOfficePicks } from "@/lib/showcase.functions";

export const Route = createFileRoute("/office")({
  head: () => ({ meta: [{ title: "مكتب حكيم — عقارات" }] }),
  component: OfficePage,
});

function harajUrl(link: string | null, sourceKey: string) {
  if (link?.startsWith("http://") || link?.startsWith("https://")) return link;
  if (sourceKey.startsWith("haraj:")) return `https://haraj.com.sa/${sourceKey.slice(6)}`;
  return "https://haraj.com.sa";
}

function OfficePage() {
  const fetchPicks = useServerFn(getOfficePicks);
  const query = useQuery({
    queryKey: ["office-properties"],
    queryFn: () => fetchPicks({ data: { kind: "property", limit: 50 } }),
    staleTime: 60_000,
  });
  const properties = query.data ?? [];

  return (
    <main dir="rtl" className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-primary">HkeeemAI</p>
          <h1 className="text-3xl font-black">مكتب حكيم</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            إعلانات عقارية مختارة، مع فتح الإعلان الخارجي مباشرة في حراج.
          </p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold"
        >
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> تحديث
        </button>
      </header>
      {query.isPending ? (
        <p className="rounded-3xl border p-8 text-center">جارٍ تحميل العقارات…</p>
      ) : properties.length === 0 ? (
        <p className="rounded-3xl border p-8 text-center text-muted-foreground">
          لا توجد إعلانات عقارية منشورة حاليًا.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <article
              id={`property-${property.id}`}
              key={property.id}
              className="flex scroll-mt-24 flex-col gap-3 rounded-3xl border bg-card p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">
                  {property.city ?? "السعودية"}
                </span>
              </div>
              <h2 className="text-lg font-black">{property.title}</h2>
              {property.subtitle && (
                <p className="text-sm text-muted-foreground">{property.subtitle}</p>
              )}
              {property.price !== null && (
                <p className="font-black text-primary">
                  {property.price.toLocaleString("ar-SA")} ر.س
                </p>
              )}
              <a
                href={harajUrl(property.link_url, property.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground"
              >
                <ExternalLink className="h-4 w-4" /> فتح الإعلان في حراج
              </a>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
