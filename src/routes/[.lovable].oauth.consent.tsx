import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "السماح بالوصول — Hkeeem AI" },
      { name: "description", content: "وافق على ربط مساعدك الذكي بحسابك في Hkeeem AI." },
      { property: "og:title", content: "السماح بالوصول — Hkeeem AI" },
      { property: "og:description", content: "وافق على ربط مساعدك الذكي بحسابك في Hkeeem AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConsentPage,
});

type Details = { client?: { name?: string } | null; redirect_uri?: string; redirect_url?: string };

function ConsentPage() {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const authorizationId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("authorization_id")
      : null;

  useEffect(() => {
    (async () => {
      if (!authorizationId) {
        setError("رابط الموافقة غير صالح.");
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        const back = window.location.pathname + window.location.search;
        window.location.assign(`/auth?redirect=${encodeURIComponent(back)}`);
        return;
      }
      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (error) return setError(error.message);
      const d = data as Details;
      const done = d.redirect_url ?? (d.redirect_uri && !d.client ? d.redirect_uri : undefined);
      if (done && !d.client) return window.location.assign(done);
      setDetails(d);
    })();
  }, [authorizationId]);

  async function decide(approve: boolean) {
    if (!authorizationId) return;
    setBusy(true);
    const res = approve
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);
    if (res.error) {
      setError(res.error.message);
      setBusy(false);
      return;
    }
    const url = (res.data as { redirect_url?: string; redirect_to?: string } | null);
    const target = url?.redirect_url ?? url?.redirect_to;
    if (target) window.location.assign(target);
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="rounded-3xl border border-border bg-card p-6 space-y-5 text-center">
        <ShieldCheck className="w-10 h-10 mx-auto text-primary" />
        {error ? (
          <p className="text-destructive font-bold">{error}</p>
        ) : !details ? (
          <p className="text-muted-foreground">جارٍ التحميل…</p>
        ) : (
          <>
            <h1 className="text-xl font-extrabold">
              السماح لـ {details.client?.name ?? "مساعد ذكي"} بالوصول؟
            </h1>
            <p className="text-sm text-muted-foreground">
              سيتمكن من البحث في العروض والمتاجر والفروع المنشورة باسم حسابك. يمكنك إلغاء الوصول بتسجيل الخروج.
            </p>
            <div className="flex gap-3">
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                السماح
              </Button>
              <Button className="flex-1" variant="outline" disabled={busy} onClick={() => decide(false)}>
                رفض
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
