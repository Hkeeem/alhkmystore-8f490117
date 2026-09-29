import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  ChevronRight,
  MessageCircle,
  Building2,
  ExternalLink,
} from "lucide-react";
import { fetchRealBranches, directionsUrl, telHref, waHref } from "@/lib/real-branches";

export const Route = createFileRoute("/branches/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الفرع — فروع حكيم" },
      {
        name: "description",
        content: "تفاصيل فرع حكيم: الموقع على الخريطة، العنوان، أوقات الدوام، وأرقام التواصل.",
      },
      { property: "og:title", content: "تفاصيل الفرع — فروع حكيم" },
      {
        property: "og:description",
        content: "كل تفاصيل الفرع: الموقع، الدوام، التواصل، والاتجاهات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BranchDetailPage,
});

function BranchDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["real-branches"],
    queryFn: fetchRealBranches,
  });
  const branch = data?.find((b) => b.id === id);

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen grid place-items-center text-muted-foreground">
        جارِ التحميل…
      </div>
    );
  }

  if (!branch) {
    return (
      <div dir="rtl" className="min-h-screen grid place-items-center gap-3 text-center px-6">
        <p className="font-semibold">هذا الفرع غير موجود</p>
        <Link to="/branches" className="text-primary hover:underline">
          العودة لقائمة الفروع
        </Link>
      </div>
    );
  }

  const embed = `https://www.google.com/maps?q=${branch.lat},${branch.lng}&hl=ar&z=15&output=embed`;

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link to="/branches" className="p-2 -mr-2 rounded-lg hover:bg-muted">
            <ChevronRight className="w-5 h-5" />
          </Link>
          <h1 className="font-bold truncate">{branch.name}</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <div className="rounded-2xl overflow-hidden border border-border">
          <iframe
            title={`موقع ${branch.name}`}
            src={embed}
            className="w-full h-64"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Row icon={Building2} label="المتجر" value={branch.store_name} />
          <Row
            icon={MapPin}
            label="الموقع"
            value={[branch.city, branch.district, branch.address].filter(Boolean).join(" — ")}
          />
          {branch.hours && <Row icon={Clock} label="أوقات الدوام" value={branch.hours} />}
          {branch.phone && (
            <Row
              icon={Phone}
              label="رقم التواصل"
              value={
                <a href={telHref(branch.phone)} className="text-primary hover:underline" dir="ltr">
                  {branch.phone}
                </a>
              }
            />
          )}
          {branch.whatsapp && (
            <Row
              icon={MessageCircle}
              label="واتساب"
              value={
                <a
                  href={waHref(branch.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  dir="ltr"
                >
                  {branch.whatsapp}
                </a>
              }
            />
          )}
          <Row
            icon={MapPin}
            label="الإحداثيات"
            value={<span dir="ltr">{`${branch.lat}, ${branch.lng}`}</span>}
          />
          {branch.notes && <p className="text-sm text-muted-foreground pt-1">{branch.notes}</p>}
        </section>

        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={directionsUrl(branch)}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 rounded-xl bg-primary text-primary-foreground grid place-items-center font-semibold"
          >
            <span className="flex items-center gap-2">
              <Navigation className="w-4 h-4" /> الاتجاهات
            </span>
          </a>
          {branch.balady_url && (
            <a
              href={branch.balady_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-xl border border-border grid place-items-center font-semibold hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> رخصة بلدي
              </span>
            </a>
          )}
        </div>

        <Link
          to="/maps"
            search={{ deal: undefined }}
          className="block text-center text-sm text-primary hover:underline pb-6"
        >
          عرض الفرع ضمن خريطتي
        </Link>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="w-4 h-4 mt-0.5 text-primary shrink-0" />
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="flex-1 min-w-0">{value}</span>
    </div>
  );
}
