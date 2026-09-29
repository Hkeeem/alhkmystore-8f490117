import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MapPin, Phone, Clock, Navigation, Search, Building2, Map as MapIcon } from "lucide-react";
import { fetchRealBranches, directionsUrl, telHref, type RealBranch } from "@/lib/real-branches";

export const Route = createFileRoute("/branches")({
  head: () => ({
    meta: [
      { title: "فروع حكيم — كل الفروع بتفاصيلها الكاملة" },
      {
        name: "description",
        content:
          "دليل فروع حكيم في مدن المملكة: العنوان، أوقات الدوام، رقم التواصل، ورابط الاتجاهات لكل فرع.",
      },
      { property: "og:title", content: "فروع حكيم — كل الفروع بتفاصيلها الكاملة" },
      {
        property: "og:description",
        content: "استعرض فروع حكيم حسب المدينة والمتجر مع تفاصيل كاملة واتجاهات مباشرة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BranchesPage,
});

function BranchesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["real-branches"],
    queryFn: fetchRealBranches,
  });
  const [city, setCity] = useState<string>("الكل");
  const [q, setQ] = useState("");

  const branches = data ?? [];
  const cities = useMemo(
    () => ["الكل", ...Array.from(new Set(branches.map((b) => b.city)))],
    [branches],
  );
  const filtered = useMemo(() => {
    const term = q.trim();
    return branches.filter(
      (b) =>
        (city === "الكل" || b.city === city) &&
        (!term ||
          [b.name, b.store_name, b.district, b.address].some((v) => v?.includes(term))),
    );
  }, [branches, city, q]);

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">فروع حكيم</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            كل فرع بتفاصيله الكاملة: العنوان، الدوام، التواصل، والاتجاهات.
          </p>
          <Link
            to="/maps"
            search={{ deal: undefined }}
            className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
          >
            <MapIcon className="w-4 h-4" /> عرض الفروع على خريطتي
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث باسم الفرع أو الحي"
              className="w-full h-11 rounded-xl border border-border bg-card pr-9 pl-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {cities.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {cities.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${
                  city === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">جارِ تحميل الفروع…</p>}
        {error && (
          <p className="text-sm text-destructive">تعذّر تحميل الفروع، حاول تحديث الصفحة.</p>
        )}
        {!isLoading && !error && branches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="font-semibold mb-1">لا توجد فروع مضافة بعد</p>
            <p className="text-sm text-muted-foreground">
              تُضاف الفروع الحقيقية من لوحة التحكم، وتظهر هنا وعلى خريطتي مباشرة.
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((b) => (
            <BranchCard key={b.id} branch={b} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BranchCard({ branch: b }: { branch: RealBranch }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-bold truncate">{b.name}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {b.store_name} • {b.city}
            {b.district ? ` • ${b.district}` : ""}
          </p>
        </div>
      </div>
      {b.address && (
        <p className="text-sm text-muted-foreground flex items-start gap-1">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{b.address}</span>
        </p>
      )}
      {b.hours && (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="w-4 h-4 shrink-0" /> {b.hours}
        </p>
      )}
      {b.phone && (
        <a
          href={telHref(b.phone)}
          className="text-sm text-primary flex items-center gap-1 hover:underline"
          dir="ltr"
        >
          <Phone className="w-4 h-4" /> {b.phone}
        </a>
      )}
      <div className="flex gap-2 mt-1">
        <Link
          to="/branches/$id"
          params={{ id: b.id }}
          className="flex-1 h-10 rounded-xl border border-border text-sm grid place-items-center hover:bg-muted"
        >
          التفاصيل الكاملة
        </Link>
        <a
          href={directionsUrl(b)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm grid place-items-center gap-1"
        >
          <span className="flex items-center gap-1">
            <Navigation className="w-4 h-4" /> الاتجاهات
          </span>
        </a>
      </div>
    </article>
  );
}
