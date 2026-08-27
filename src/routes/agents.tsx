import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Crosshair, Megaphone, Copy, ExternalLink, AlertTriangle, Power } from "lucide-react";
import { useLiveDeals } from "@/hooks/use-live-deals";
import {
  AGENT_DESC,
  AGENT_LABEL,
  CHANNEL_LABEL,
  GUARD_ISSUE_LABEL,
  buildPublishPost,
  channelShareUrl,
  discountOf,
  guardScan,
  hunt,
  readAgentState,
  saveAgentState,
  type AgentDeal,
  type AgentId,
  type AgentState,
  type PublishChannel,
} from "@/lib/agents";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "وكلاء حكيم AI — الحارس والصياد والناشر" },
      {
        name: "description",
        content:
          "فعّل حارس حكيم لفحص العروض، والصياد لاصطياد أقوى التخفيضات، وناشر حكيم لتجهيز منشور جاهز للمشاركة.",
      },
      { property: "og:title", content: "وكلاء حكيم AI — الحارس والصياد والناشر" },
      {
        property: "og:description",
        content: "ثلاثة وكلاء أذكياء يفحصون العروض الحقيقية ويصطادون الأقوى ويجهّزون نص النشر.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentsPage,
});

const CHANNELS: PublishChannel[] = ["whatsapp", "telegram", "x", "snapchat"];

function AgentsPage() {
  const { data, isPending } = useLiveDeals(60);
  const [state, setState] = useState<AgentState>({ guard: true, hunter: true, publisher: true });
  const [channel, setChannel] = useState<PublishChannel>("whatsapp");

  useEffect(() => {
    setState(readAgentState());
  }, []);

  const toggle = (id: AgentId) => {
    setState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveAgentState(next);
      toast.success(`${AGENT_LABEL[id]} ${next[id] ? "مُفعّل الآن" : "متوقف"}`);
      return next;
    });
  };

  const all: AgentDeal[] = useMemo(
    () =>
      (data ?? []).map((d) => ({
        id: d.id,
        title: d.title,
        price: Number(d.price),
        original_price: Number(d.original_price),
        discount_percent: d.discount_percent,
        product_url: d.product_url,
        expires_at: d.expires_at,
        clicks: d.clicks,
        category: d.category,
        storeName: d.merchants?.name ?? null,
      })),
    [data],
  );

  const scan = useMemo(() => guardScan(all), [all]);
  const pool = state.guard ? scan.safe : all;
  const hunted = useMemo(() => (state.hunter ? hunt(pool, 6) : []), [pool, state.hunter]);

  const origin = typeof window === "undefined" ? "https://alhkmy.store" : window.location.origin;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم نسخ نص المنشور");
    } catch {
      toast.error("تعذّر النسخ، انسخ النص يدوياً");
    }
  };

  return (
    <main dir="rtl" className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display font-black text-2xl">وكلاء حكيم AI</h1>
        <p className="text-sm text-muted-foreground">
          ثلاثة وكلاء يعملون على العروض الحقيقية من التجّار المعتمدين فقط.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="تفعيل الوكلاء">
        <AgentToggle id="guard" icon={ShieldCheck} on={state.guard} onToggle={toggle} />
        <AgentToggle id="hunter" icon={Crosshair} on={state.hunter} onToggle={toggle} />
        <AgentToggle id="publisher" icon={Megaphone} on={state.publisher} onToggle={toggle} />
      </section>

      {/* حارس حكيم */}
      <section className="space-y-3" aria-labelledby="guard-title">
        <h2 id="guard-title" className="font-display font-black text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" /> تقرير حارس حكيم
        </h2>
        {!state.guard ? (
          <p className="text-sm text-muted-foreground">الحارس متوقف — العروض تُعرض دون فحص.</p>
        ) : isPending ? (
          <div className="h-20 rounded-3xl bg-muted animate-pulse" />
        ) : (
          <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-bold">
              فحص {all.length} عرضاً · اجتاز {scan.safe.length} · حُجب {scan.blocked.length}
            </p>
            {scan.blocked.length > 0 && (
              <ul className="space-y-2 list-none m-0 p-0">
                {scan.blocked.slice(0, 6).map((b) => (
                  <li key={b.deal.id} className="text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <span>
                      <span className="font-bold">{b.deal.title}</span>{" "}
                      <span className="text-muted-foreground">
                        — {b.issues.map((i) => GUARD_ISSUE_LABEL[i]).join(" · ")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* الصياد + الناشر */}
      <section className="space-y-3" aria-labelledby="hunter-title">
        <h2 id="hunter-title" className="font-display font-black text-lg flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-primary" /> صيد الصياد
        </h2>

        {state.publisher && (
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="منصة النشر">
            {CHANNELS.map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                aria-pressed={channel === c}
                className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap press-ripple ${
                  channel === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {CHANNEL_LABEL[c]}
              </button>
            ))}
          </div>
        )}

        {!state.hunter ? (
          <p className="text-sm text-muted-foreground">الصياد متوقف — فعّله لاصطياد أقوى العروض.</p>
        ) : isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : hunted.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            لا توجد عروض حقيقية متاحة للصيد حالياً.
          </div>
        ) : (
          <ul className="space-y-3 list-none m-0 p-0">
            {hunted.map(({ deal, reason }) => {
              const link = `${origin}/deals/${deal.id}`;
              const post = buildPublishPost(deal, channel, link);
              return (
                <li key={deal.id} className="rounded-3xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{deal.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {deal.storeName ?? "تاجر معتمد"} · {deal.price} ر.س بدلاً من {deal.original_price} ر.س
                      </p>
                    </div>
                    <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                      خصم {discountOf(deal)}٪
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-primary">🎯 {reason}</p>

                  {state.publisher && (
                    <div className="space-y-2 pt-1">
                      <pre className="text-[11px] whitespace-pre-wrap bg-secondary/50 rounded-2xl p-3 font-sans leading-relaxed">
                        {post}
                      </pre>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copy(post)}
                          className="text-[11px] font-black px-3 py-2 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1 press-ripple"
                        >
                          <Copy className="w-3.5 h-3.5" /> نسخ النص
                        </button>
                        <a
                          href={channelShareUrl(channel, post, link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-black px-3 py-2 rounded-full bg-primary text-primary-foreground flex items-center gap-1 press-ripple"
                        >
                          نشر على {CHANNEL_LABEL[channel]} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function AgentToggle({
  id,
  icon: Icon,
  on,
  onToggle,
}: {
  id: AgentId;
  icon: typeof ShieldCheck;
  on: boolean;
  onToggle: (id: AgentId) => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-black text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" /> {AGENT_LABEL[id]}
        </span>
        <button
          onClick={() => onToggle(id)}
          role="switch"
          aria-checked={on}
          aria-label={`تفعيل ${AGENT_LABEL[id]}`}
          className={`text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1 press-ripple ${
            on ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          <Power className="w-3 h-3" /> {on ? "مُفعّل" : "متوقف"}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{AGENT_DESC[id]}</p>
    </div>
  );
}
