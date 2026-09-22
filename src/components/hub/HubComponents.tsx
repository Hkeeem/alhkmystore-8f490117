import type { PlatformSection, PinnedTool, SmartBot, Tool } from "@/data/tools";

export type Filter = { key: string; label: string; count?: number; active?: boolean };

export function FilterPills({ filters, activeKey, onChange }: { filters: Filter[]; activeKey: string; onChange: (key: string) => void }) {
  return <div role="tablist" className="mb-6 flex flex-wrap gap-2">
    {filters.map((f) => <button key={f.key} role="tab" aria-selected={activeKey === f.key} onClick={() => onChange(f.key)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeKey === f.key ? "bg-[var(--gold-400)] text-[var(--maroon-950)] shadow-md shadow-[rgba(212,175,55,.3)]" : "bg-[var(--maroon-900)] text-[var(--gold-100)] ring-1 ring-[rgba(212,175,55,.2)] hover:bg-[var(--maroon-800)]"}`}>
      {f.label}{typeof f.count === "number" && <span className={`ms-2 rounded-full px-2 py-0.5 text-xs ${activeKey === f.key ? "bg-[rgba(43,10,16,.15)] text-[var(--maroon-900)]" : "bg-[rgba(212,175,55,.15)] text-[var(--gold-300)]"}`}>{f.count}</span>}
    </button>)}
  </div>;
}

export function PinnedTools({ items }: { items: PinnedTool[] }) {
  return <section className="mb-8 rounded-2xl border border-[rgba(212,175,55,.5)] bg-[var(--gold-50)] p-4">
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--maroon-800)]"><span aria-hidden>📌</span> مثبتة في الأعلى للوصول السريع <span className="rounded-full bg-[var(--gold-400)] px-2 py-0.5 text-xs font-bold text-[var(--maroon-950)]">{items.length}</span></h2>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{items.map((it) => <article key={it.id} className="rounded-xl bg-[var(--maroon-900)] p-5 text-[var(--gold-50)] shadow-lg ring-1 ring-[rgba(212,175,55,.6)]"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,175,55,.15)] text-2xl text-[var(--gold-300)]">{it.icon === "wand" ? "🪄" : it.icon === "chat" ? "💬" : "⭐"}</span>{it.badge && <span className="rounded-full border border-[rgba(212,175,55,.5)] bg-[rgba(212,175,55,.15)] px-2 py-0.5 text-xs text-[var(--gold-300)]">{it.badge}</span>}</div><h3 className="mt-3 text-sm font-semibold">{it.title}</h3></article>)}</div>
    <p className="mt-4 text-center text-xs text-[rgba(114,34,50,.7)]">اختر التصنيف لعرض الأدوات المخصصة لتسهيل الوصول إليها</p>
  </section>;
}

export function HeroBanner() {
  return <section className="mb-6 overflow-hidden rounded-2xl border border-[rgba(212,175,55,.6)] bg-gradient-to-l from-[var(--gold-300)] via-[var(--gold-100)] to-[var(--gold-50)] p-8 shadow-sm"><div className="flex flex-col items-center text-center"><div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 text-3xl shadow-inner ring-1 ring-[rgba(212,175,55,.5)]">✨🪄</div><h2 className="text-lg font-bold text-[var(--maroon-900)]">اكتشف أدوات الذكاء الاصطناعي الأكثر استخدامًا</h2><p className="mt-1 text-sm text-[rgba(87,26,38,.8)]">مجموعة مختارة من أدوات HkeeemAI لمقارنة العروض والتوفير الذكي</p></div></section>;
}

export function ToolCard({ tool }: { tool: Tool }) {
  const href = tool.id === "image-search" ? "/chat" : tool.id === "ai-chat" ? "/chat" : tool.id === "smart-list" ? "/smart-list" : tool.id === "real-estate" ? "/real-estate" : "/";
  return <a href={href} className="ring-gold relative block rounded-xl bg-[var(--maroon-900)] p-5 text-[var(--gold-50)] shadow-md transition hover:-translate-y-0.5 hover:bg-[var(--maroon-800)]"><article>{tool.badge && <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tool.badge.tone === "new" ? "border border-[rgba(212,175,55,.4)] bg-[var(--maroon-600)] text-[var(--gold-100)]" : tool.badge.tone === "active" ? "border border-[rgba(47,125,91,.3)] bg-[var(--success-soft)] text-[var(--success)]" : "border border-[rgba(212,175,55,.5)] bg-[rgba(212,175,55,.15)] text-[var(--gold-300)]"}`}>{tool.badge.label}</span>}{tool.favorite && <span aria-label="مفضل" className="absolute right-3 top-3 text-[var(--gold-400)]">★</span>}<div className="flex h-full flex-col items-center justify-center gap-2 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--maroon-800)] text-2xl ring-1 ring-[rgba(212,175,55,.3)]">{tool.icon}</div><h3 className="text-sm font-semibold">{tool.title}</h3></div></article></a>;
}

export function ActionCards() {
  return <section className="my-10 grid gap-4 md:grid-cols-2"><a href="https://alhkmy.app" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-2xl border-2 border-[var(--gold-400)] bg-[var(--maroon-900)] p-6 text-[var(--gold-50)] shadow-md transition hover:bg-[var(--maroon-800)]"><span className="flex items-center gap-3"><span aria-hidden className="text-2xl">🔗</span><span className="text-lg font-bold text-[var(--gold-300)]">Alhkmy.app</span></span><span className="text-sm text-[rgba(247,236,210,.7)]">alhkmy.app</span></a><Link to="/chat" className="flex items-center justify-between rounded-2xl border-2 border-[var(--maroon-700)] bg-[var(--maroon-950)] p-6 text-[var(--gold-50)] shadow-md transition hover:bg-[var(--maroon-900)]"><span className="flex items-center gap-3"><span aria-hidden className="text-2xl">🤖</span><span className="text-lg font-bold text-[var(--gold-300)]">مساعد حكيم</span></span><span className="text-sm text-[rgba(247,236,210,.7)]">Hkeeem Assistant</span></Link></section>;
}

export function FooterSections({ sections, bots }: { sections: PlatformSection[]; bots: SmartBot[] }) {
  const gateways = ["مدى Mada", "Apple Pay", "تمارا Tamara", "Visa / Master"];
  return <footer className="mt-12 rounded-2xl bg-[var(--maroon-950)] p-6 text-[var(--gold-100)] shadow-inner ring-1 ring-[rgba(212,175,55,.3)]"><div className="grid gap-8 md:grid-cols-3"><div><h3 className="mb-3 text-sm font-bold text-[var(--gold-400)]">{sections[0]?.title}</h3><ul className="space-y-2 text-sm">{sections[0]?.items.map((s) => <li key={s}>{s}</li>)}</ul></div><div><h3 className="mb-3 text-sm font-bold text-[var(--gold-400)]">بوتات حكيم الآلية</h3><ul className="space-y-2 text-sm">{bots.map((b) => <li key={b.name} className="flex items-center gap-2"><span aria-hidden>{b.emoji}</span><span>{b.name}</span></li>)}</ul></div><div><h3 className="mb-3 text-sm font-bold text-[var(--gold-400)]">بوابات الدفع المعتمدة</h3><div className="flex flex-wrap gap-2">{gateways.map((g) => <span key={g} className="rounded-md border border-[rgba(212,175,55,.4)] bg-[var(--maroon-900)] px-3 py-1 text-xs">{g}</span>)}</div><p className="mt-4 text-[11px] leading-relaxed text-[rgba(247,236,210,.6)]">بيانات الدفع مشفّرة بأمان ببروتوكولات الأمان <strong className="text-[var(--gold-300)]">SSL 256-bit</strong>.</p></div></div><div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(212,175,55,.2)] pt-4 text-xs text-[rgba(247,236,210,.6)]"><span>حكيم AI — alhkmy.store</span><span>المنصة السعودية الذكية لمقارنة عروض الأسواق المركزية الكبرى</span></div></footer>;
}
