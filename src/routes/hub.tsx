import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ActionCards, FilterPills, FooterSections, HeroBanner, PinnedTools, ToolCard } from "@/components/hub/HubComponents";
import { filterDefinitions, pinnedTools, platformSections, smartBots, tools } from "@/data/tools";

export const Route = createFileRoute("/hub")({
  head: () => ({ meta: [{ title: "أدوات AI | حكيم AI — HkeeemAI" }, { name: "description", content: "مركز أدوات الذكاء الاصطناعي والبوتات الذكية لمقارنة العروض والتوفير الذكي في السعودية." }] }),
  component: HubPage,
});

function HubPage() {
  const [activeKey, setActiveKey] = useState("all");
  const visibleTools = useMemo(() => {
    if (activeKey === "search") return tools.filter((tool) => ["smart-search", "image-search", "price-compare", "coupon-finder"].includes(tool.id));
    if (activeKey === "code") return tools.filter((tool) => ["analytics", "merchant", "agents"].includes(tool.id));
    return tools;
  }, [activeKey]);
  const filters = filterDefinitions.map((filter) => ({ ...filter, active: filter.key === activeKey }));

  return <main dir="rtl" lang="ar" className="min-h-screen bg-[var(--cream-50)] text-[var(--maroon-950)]"><section className="mx-auto max-w-6xl px-4 py-8"><header className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold text-[var(--maroon-900)]">أدوات <span className="text-[var(--gold-500)]">AI</span></h1><span className="rounded-full bg-[var(--gold-100)] px-3 py-1 text-xs font-medium text-[var(--maroon-800)] ring-1 ring-[rgba(212,175,55,.4)]">المعروض: {visibleTools.length} من {tools.length} أداة</span></header><FilterPills filters={filters} activeKey={activeKey} onChange={setActiveKey} /><PinnedTools items={pinnedTools} /><HeroBanner /><section aria-label="قائمة الأدوات" className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{visibleTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</section><ActionCards /><FooterSections sections={platformSections} bots={smartBots} /></section></main>;
}
