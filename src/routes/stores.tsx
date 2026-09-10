import { stores } from "@/data/deals";
import { getStoreIcon } from "@/lib/icons";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Store as StoreIcon } from "lucide-react";
import { StoresPageSkeleton } from "@/components/Skeletons";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: "المتاجر — HkeeemAI" },
      { name: "description", content: "كل المتاجر السعودية الشريكة في مكان واحد: العثيم، بنده، لولو، نون، جرير، إكسترا، النهدي." },
    ],
  }),
  pendingComponent: StoresPageSkeleton,
  pendingMs: 0,
  pendingMinMs: 300,
  component: Stores,
});

function Stores() {
  const { t } = useI18n();
  const grouped = stores.reduce<Record<string, typeof stores>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});
  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-8">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-gold glow-gold flex items-center justify-center">
          <StoreIcon className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-gold-shine">المتاجر</h1>
          <p className="text-sm text-muted-foreground">{stores.length} متجرًا شريكًا</p>
        </div>
      </header>

      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat}>
          <h2 className="font-black text-lg mb-3">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {items.map((s) => {
              const Icon = getStoreIcon(s);
              return (
                <Link
                  key={s.id}
                  to="/deals"
                  search={{ store: s.id }}
                  className="p-4 rounded-2xl bg-card border border-border/60 shadow-card hover:border-primary hover:shadow-glow hover-lift press-ripple flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: s.color }}>
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{s.name}</div>
                    <div className="text-[10px] text-muted-foreground">{s.category}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
