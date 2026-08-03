import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ListSkeleton } from "@/components/Skeletons";
import { toast } from "sonner";
import {
  Shield, Users, MessageSquareWarning, Lightbulb, Bell, Crown,
  BarChart3, ScrollText, LayoutDashboard, Loader2, Send, Check, X, Sparkles,
  Wallet, BellRing, Rocket, RefreshCw, ExternalLink, AlertTriangle,
} from "lucide-react";
import {
  getAdminContext, claimSuperAdmin, getAdminStats,
  listComplaints, updateComplaint,
  listSuggestions, updateSuggestion,
  listUsersWithRoles, assignRole, revokeRole,
  listPremium, broadcastNotification, listAuditLog,
} from "@/lib/admin.functions";
import { getDeployStatus } from "@/lib/deploy.functions";
import {
  adminListCashback, adminUpdateCashbackStatus, adminListAlerts,
} from "@/lib/user.functions";

type Tab =
  | "dashboard" | "complaints" | "suggestions" | "users"
  | "notifications" | "premium" | "cashback" | "alerts" | "audit" | "deploy";


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — Hkeeem AI" },
      { name: "description", content: "لوحة إدارة حكيم AI: إدارة المستخدمين والعروض والشكاوى والإشعارات والاشتراكات." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const ctxQ = useQuery({ queryKey: ["admin-context"], queryFn: () => getAdminContext() });

  if (ctxQ.isLoading) {
    return (
      <div dir="rtl" className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const ctx = ctxQ.data;
  if (!ctx?.isStaff) return <NotStaff hasClaim={!ctx || ctx.roles.length === 0} onClaimed={() => ctxQ.refetch()} />;

  const roles = ctx.roles;
  const can = (allowed: Array<string>) => allowed.some((r) => roles.includes(r as never));

  const tabs = ([
    { id: "dashboard" as const, label: "الرئيسية", icon: LayoutDashboard, allow: ["super_admin","admin","support","content_manager"] },
    { id: "complaints" as const, label: "الشكاوى", icon: MessageSquareWarning, allow: ["super_admin","admin","support"] },
    { id: "suggestions" as const, label: "الاقتراحات", icon: Lightbulb, allow: ["super_admin","admin","content_manager"] },
    { id: "users" as const, label: "المستخدمون", icon: Users, allow: ["super_admin","admin"] },
    { id: "notifications" as const, label: "الإشعارات", icon: Bell, allow: ["super_admin","admin","content_manager"] },
    { id: "premium" as const, label: "Premium", icon: Crown, allow: ["super_admin","admin"] },
    { id: "cashback" as const, label: "كاش باك", icon: Wallet, allow: ["super_admin","admin"] },
    { id: "alerts" as const, label: "تنبيهات الأسعار", icon: BellRing, allow: ["super_admin","admin"] },
    { id: "audit" as const, label: "سجل العمليات", icon: ScrollText, allow: ["super_admin","admin"] },
    { id: "deploy" as const, label: "حالة النشر", icon: Rocket, allow: ["super_admin","admin"] },
  ]).filter((t) => can(t.allow));


  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold">لوحة التحكم</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              ({roles.join("، ")})
            </span>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline">العودة للتطبيق</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid md:grid-cols-[220px_1fr] gap-6">
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <main className="min-w-0">
          {tab === "dashboard" && <DashboardTab />}
          {tab === "complaints" && <ComplaintsTab />}
          {tab === "suggestions" && <SuggestionsTab />}
          {tab === "users" && <UsersTab canManageRoles={roles.includes("super_admin")} />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "premium" && <PremiumTab />}
          {tab === "cashback" && <CashbackAdminTab />}
          {tab === "alerts" && <AlertsAdminTab />}
          {tab === "audit" && <AuditTab />}
          {tab === "deploy" && <DeployTab />}

        </main>
      </div>
    </div>
  );
}

const VERCEL_LOGS_URL = "https://vercel.com/dashboard";

const STATE_STYLES: Record<string, { label: string; cls: string }> = {
  READY: { label: "ناجح", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  ERROR: { label: "فشل", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  BUILDING: { label: "قيد البناء", cls: "bg-primary/15 text-primary border-primary/30" },
  QUEUED: { label: "في الانتظار", cls: "bg-muted text-muted-foreground border-border" },
  CANCELED: { label: "أُلغي", cls: "bg-muted text-muted-foreground border-border" },
};

function fmtTime(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
}

function DeployTab() {
  const q = useQuery({
    queryKey: ["deploy-status"],
    queryFn: () => getDeployStatus(),
    refetchInterval: 60_000,
  });

  const logsHref =
    (q.data && "inspectorUrl" in q.data && q.data.inspectorUrl) ||
    q.data?.dashboardUrl ||
    VERCEL_LOGS_URL;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          آخر عملية نشر (Redeploy)
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => q.refetch()}
            disabled={q.isFetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/25 text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${q.isFetching ? "animate-spin" : ""}`} />
            تحديث
          </button>
          <a
            href={logsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            <ExternalLink className="w-4 h-4" />
            سجلات Vercel
          </a>
        </div>
      </div>

      {q.isLoading && <ListSkeleton count={2} />}

      {q.error && (
        <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/10 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">تعذّر جلب حالة النشر.</p>
            <p className="text-muted-foreground">تحقّق من مفاتيح Vercel ثم أعد المحاولة.</p>
          </div>
        </div>
      )}

      {q.data && !q.data.configured && (
        <div className="p-5 rounded-2xl border border-primary/20 bg-card space-y-2 text-sm">
          <p className="font-semibold">لم تُربط بيانات النشر بعد</p>
          <p className="text-muted-foreground">{q.data.reason}</p>
          <p className="text-muted-foreground">
            أضف المفاتيح <code className="text-primary">VERCEL_TOKEN</code> و
            <code className="text-primary"> VERCEL_PROJECT_ID</code> (و
            <code className="text-primary"> VERCEL_TEAM_ID</code> للفرق) لعرض آخر نتيجة تلقائياً،
            أو افتح السجلات مباشرة من الزر بالأعلى.
          </p>
        </div>
      )}

      {q.data?.configured && (
        <div className="p-5 rounded-2xl border border-primary/20 bg-card shadow-card space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full border text-xs font-bold ${
                STATE_STYLES[q.data.state]?.cls ?? "bg-muted text-muted-foreground border-border"
              }`}
            >
              {STATE_STYLES[q.data.state]?.label ?? q.data.state}
            </span>
            {q.data.target && (
              <span className="text-xs text-muted-foreground">البيئة: {q.data.target}</span>
            )}
            {q.data.branch && (
              <span className="text-xs text-muted-foreground">الفرع: {q.data.branch}</span>
            )}
          </div>

          {q.data.errorMessage && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 break-words">
              {q.data.errorMessage}
            </p>
          )}

          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <Row label="وقت البدء" value={fmtTime(q.data.createdAt)} />
            <Row label="وقت الانتهاء" value={fmtTime(q.data.readyAt)} />
            <Row
              label="المدة"
              value={q.data.durationMs ? `${Math.round(q.data.durationMs / 1000)} ثانية` : "—"}
            />
            <Row label="الإصدار (Commit)" value={q.data.commitSha?.slice(0, 7) ?? "—"} />
          </dl>

          {q.data.commitMessage && (
            <p className="text-sm text-muted-foreground break-words">
              رسالة الإصدار: {q.data.commitMessage}
            </p>
          )}

          {q.data.url && (
            <a
              href={q.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              فتح نسخة النشر
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}



function NotStaff({ hasClaim, onClaimed }: { hasClaim: boolean; onClaimed: () => void }) {
  const claim = useServerFn(claimSuperAdmin);
  const [busy, setBusy] = useState(false);
  async function handleClaim() {
    setBusy(true);
    try {
      const res = await claim();
      if (res.claimed) {
        toast.success("تم تعيينك مديراً عاماً 👑");
        onClaimed();
      } else {
        toast.error("توجد لوحة تحكم مُعرَّفة مسبقاً. راجع المدير العام.");
      }
    } catch (e) {
      toast.error("تعذّر التنفيذ");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div dir="rtl" className="min-h-screen grid place-items-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-primary/20 bg-card">
        <Shield className="w-12 h-12 mx-auto text-primary" />
        <h1 className="text-xl font-bold">لوحة التحكم للمسؤولين</h1>
        <p className="text-muted-foreground text-sm">
          هذه الصفحة متاحة فقط لفريق الإدارة. إذا كنت المسؤول الأول عن التطبيق، يمكنك تفعيل صلاحيات المدير العام الآن.
        </p>
        {hasClaim && (
          <button
            onClick={handleClaim}
            disabled={busy}
            className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            {busy ? "جارٍ..." : "تفعيل المدير العام (لأول مرة فقط)"}
          </button>
        )}
        <Link to="/" className="block text-sm text-primary hover:underline">العودة للرئيسية</Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) {
  return (
    <div className="p-5 rounded-2xl border border-primary/20 bg-card shadow-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="text-3xl font-bold text-primary">{value}</div>
    </div>
  );
}

function DashboardTab() {
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: () => getAdminStats() });
  if (q.isLoading) return <ListSkeleton count={4} />;
  if (q.error) return <p className="text-destructive">تعذّر تحميل الإحصائيات.</p>;
  const s = q.data!;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="المستخدمون" value={s.users} icon={Users} />
      <StatCard label="شكاوى مفتوحة" value={s.complaintsOpen} icon={MessageSquareWarning} />
      <StatCard label="اقتراحات" value={s.suggestions} icon={Lightbulb} />
      <StatCard label="اشتراكات نشطة" value={s.premiumActive} icon={Crown} />
      <div className="sm:col-span-2 lg:col-span-4 p-5 rounded-2xl border border-primary/10 bg-card/60 text-sm text-muted-foreground flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0" />
        <p>هذه المرحلة الأولى من لوحة التحكم. سنضيف تقارير Analytics تفصيلية ورسوم بيانية في المرحلة القادمة.</p>
      </div>
    </div>
  );
}

function ComplaintsTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-complaints"], queryFn: () => listComplaints() });
  const upd = useMutation({
    mutationFn: (v: { id: string; status: string | null; response: string | null }) => updateComplaint({ data: v }),
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["admin-complaints"] }); },
    onError: () => toast.error("فشل التحديث"),
  });

  if (q.isLoading) return <ListSkeleton count={4} />;
  const items = q.data ?? [];
  if (items.length === 0) return <EmptyState icon={MessageSquareWarning} text="لا توجد شكاوى حالياً." />;

  return (
    <div className="space-y-3">
      {items.map((c: any) => (
        <div key={c.id} className="p-4 rounded-2xl border border-primary/20 bg-card shadow-card hover-lift">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{c.subject}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "open" ? "bg-orange-500/15 text-orange-600" : "bg-green-500/15 text-green-600"}`}>
                  {c.status === "open" ? "مفتوحة" : c.status === "resolved" ? "تم الحل" : c.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.body}</p>
              {c.response && (
                <p className="text-sm mt-2 p-2 rounded bg-muted"><b>الرد:</b> {c.response}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(c.created_at).toLocaleString("ar-SA")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const response = prompt("رد على الشكوى:", c.response ?? "");
                  if (response !== null) upd.mutate({ id: c.id, status: "resolved", response });
                }}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm"
              >
                <Check className="w-4 h-4 inline mr-1" /> رد وإغلاق
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SuggestionsTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-suggestions"], queryFn: () => listSuggestions() });
  const upd = useMutation({
    mutationFn: (v: { id: string; status: string | null; tag: string | null }) => updateSuggestion({ data: v }),
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["admin-suggestions"] }); },
    onError: () => toast.error("فشل التحديث"),
  });
  if (q.isLoading) return <ListSkeleton count={4} />;
  const items = q.data ?? [];
  if (items.length === 0) return <EmptyState icon={Lightbulb} text="لا توجد اقتراحات." />;
  return (
    <div className="space-y-3">
      {items.map((s: any) => (
        <div key={s.id} className="p-4 rounded-2xl border border-primary/20 bg-card shadow-card hover-lift">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{s.subject}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s.status}</span>
                {s.tag && <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{s.tag}</span>}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.body}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => upd.mutate({ id: s.id, status: "accepted", tag: null })} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm">قبول</button>
              <button onClick={() => upd.mutate({ id: s.id, status: "rejected", tag: null })} className="px-3 py-1.5 rounded-lg bg-muted text-sm">رفض</button>
              <button onClick={() => { const t = prompt("وسم:"); if (t) upd.mutate({ id: s.id, status: null, tag: t }); }} className="px-3 py-1.5 rounded-lg border text-sm">وسم</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ canManageRoles }: { canManageRoles: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => listUsersWithRoles() });
  const assign = useMutation({
    mutationFn: (v: { userId: string; role: any }) => assignRole({ data: v }),
    onSuccess: () => { toast.success("تم منح الدور"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e?.message ?? "فشل"),
  });
  const revoke = useMutation({
    mutationFn: (v: { userId: string; role: any }) => revokeRole({ data: v }),
    onSuccess: () => { toast.success("تم سحب الدور"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e?.message ?? "فشل"),
  });

  const ROLES = ["super_admin","admin","support","content_manager","user"] as const;

  if (q.isLoading) return <ListSkeleton count={4} />;
  const items = q.data ?? [];
  return (
    <div className="space-y-3">
      {!canManageRoles && <p className="text-xs text-muted-foreground">🔒 عرض فقط — تعيين الأدوار متاح للمدير العام.</p>}
      {items.map((u: any) => (
        <div key={u.id} className="p-4 rounded-2xl border border-primary/20 bg-card shadow-card hover-lift">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold">{u.display_name || u.email}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {u.roles.length === 0 && <span className="text-xs text-muted-foreground">— بدون أدوار —</span>}
                {u.roles.map((r: string) => (
                  <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                    {r}
                    {canManageRoles && (
                      <button onClick={() => revoke.mutate({ userId: u.id, role: r })} className="hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
            {canManageRoles && (
              <select
                onChange={(e) => { const v = e.target.value; if (v) { assign.mutate({ userId: u.id, role: v }); e.target.value = ""; } }}
                className="px-3 py-1.5 rounded-lg border bg-background text-sm"
                defaultValue=""
              >
                <option value="">+ منح دور</option>
                {ROLES.filter((r) => !u.roles.includes(r)).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsTab() {
  const send = useServerFn(broadcastNotification);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  async function handleSend() {
    if (!title.trim()) return toast.error("العنوان مطلوب");
    setBusy(true);
    try {
      const res = await send({
        data: {
          title: title.trim(),
          body: body.trim() || null,
          link: link.trim() || null,
          targetUserId: target.trim() || null,
        },
      });
      toast.success(`تم الإرسال (${res.count})`);
      setTitle(""); setBody(""); setLink(""); setTarget("");
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الإرسال");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="max-w-2xl space-y-3 p-5 rounded-2xl border border-primary/20 bg-card shadow-card">
      <h2 className="font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> إرسال إشعار</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="العنوان *" className="w-full px-3 py-2 rounded-lg border bg-background" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="المحتوى" rows={3} className="w-full px-3 py-2 rounded-lg border bg-background" />
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="رابط (اختياري) — مثل /deals/123" className="w-full px-3 py-2 rounded-lg border bg-background" />
      <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="UUID مستخدم محدد (اتركه فارغاً للبث الجماعي)" className="w-full px-3 py-2 rounded-lg border bg-background text-xs" />
      <button onClick={handleSend} disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 flex items-center gap-2">
        <Send className="w-4 h-4" /> {busy ? "جارٍ..." : target ? "إرسال للمستخدم" : "بث جماعي"}
      </button>
    </div>
  );
}

function PremiumTab() {
  const q = useQuery({ queryKey: ["admin-premium"], queryFn: () => listPremium() });
  if (q.isLoading) return <ListSkeleton count={4} />;
  const items = q.data ?? [];
  if (items.length === 0) return <EmptyState icon={Crown} text="لا توجد اشتراكات." />;
  return (
    <div className="space-y-2">
      {items.map((p: any) => (
        <div key={p.id} className="p-4 rounded-2xl border border-primary/20 bg-card shadow-card hover-lift flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-semibold">{p.plan}</p>
            <p className="text-xs text-muted-foreground">{p.user_id}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${p.status === "active" ? "bg-green-500/15 text-green-600" : "bg-muted"}`}>{p.status}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(p.start_at).toLocaleDateString("ar-SA")} → {p.end_at ? new Date(p.end_at).toLocaleDateString("ar-SA") : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function AuditTab() {
  const q = useQuery({ queryKey: ["admin-audit"], queryFn: () => listAuditLog() });
  if (q.isLoading) return <ListSkeleton count={4} />;
  const items = q.data ?? [];
  if (items.length === 0) return <EmptyState icon={ScrollText} text="السجل فارغ." />;
  return (
    <div className="space-y-2">
      {items.map((a: any) => (
        <div key={a.id} className="p-3 rounded-lg border border-primary/10 bg-card text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-primary">{a.action}</span>
            {a.target_table && <span className="text-xs text-muted-foreground">→ {a.target_table}</span>}
            <span className="text-xs text-muted-foreground mr-auto">{new Date(a.created_at).toLocaleString("ar-SA")}</span>
          </div>
          {a.meta && <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">{JSON.stringify(a.meta)}</pre>}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Icon className="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p>{text}</p>
    </div>
  );
}

function CashbackAdminTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-cashback"], queryFn: () => adminListCashback() });
  const upd = useMutation({
    mutationFn: (v: { id: string; status: any }) => adminUpdateCashbackStatus({ data: v }),
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["admin-cashback"] }); },
    onError: () => toast.error("فشل"),
  });
  if (q.isLoading) return <ListSkeleton count={4} />;
  const items = q.data ?? [];
  if (items.length === 0) return <EmptyState icon={Wallet} text="لا توجد عمليات كاش باك." />;
  const STATUSES = ["pending","confirmed","paid","rejected"] as const;
  return (
    <div className="space-y-2">
      {items.map((t: any) => (
        <div key={t.id} className="p-4 rounded-2xl border border-primary/20 bg-card shadow-card hover-lift flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{t.store_id} · {t.purchase_amount} ر.س → <span className="text-primary">{t.cashback_amount} ر.س</span></p>
            <p className="text-xs text-muted-foreground">{t.user_id.slice(0,8)}… · {new Date(t.created_at).toLocaleString("ar-SA")}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            t.status === "confirmed" ? "bg-blue-500/15 text-blue-500"
            : t.status === "paid" ? "bg-green-500/15 text-green-500"
            : t.status === "rejected" ? "bg-red-500/15 text-red-500"
            : "bg-orange-500/15 text-orange-500"
          }`}>{t.status}</span>
          <select
            defaultValue={t.status}
            onChange={(e) => upd.mutate({ id: t.id, status: e.target.value })}
            className="px-2 py-1.5 rounded-lg border bg-background text-xs"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function AlertsAdminTab() {
  const q = useQuery({ queryKey: ["admin-alerts"], queryFn: () => adminListAlerts() });
  if (q.isLoading) return <ListSkeleton count={4} />;
  const items = q.data ?? [];
  if (items.length === 0) return <EmptyState icon={BellRing} text="لا توجد تنبيهات سعر." />;
  return (
    <div className="space-y-2">
      {items.map((a: any) => (
        <div key={a.id} className="p-4 rounded-2xl border border-primary/20 bg-card shadow-card hover-lift flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm line-clamp-1">{a.title}</p>
            <p className="text-xs text-muted-foreground">
              {a.user_id.slice(0,8)}… · حالي {a.current_price} → هدف <b className="text-primary">{a.target_price}</b> ر.س
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${a.active ? "bg-green-500/15 text-green-500" : "bg-muted"}`}>
            {a.active ? "مفعّل" : "متوقف"}
          </span>
          {a.triggered_at && <span className="text-xs text-green-500">✓ أُطلق</span>}
        </div>
      ))}
    </div>
  );
}
