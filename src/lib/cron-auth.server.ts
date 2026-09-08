/**
 * التحقق من أن الطلب قادم فعلًا من الجدولة الداخلية (pg_cron) وليس من أي زائر.
 * السر مخزّن في جدول داخلي لا يصل إليه المتصفح إطلاقًا (بخلاف مفتاح anon العام).
 */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** يعيد Response بحالة 401 عند فشل التحقق، أو null عند النجاح. */
export async function assertCronRequest(request: Request): Promise<Response | null> {
  const provided = (request.headers.get("x-cron-secret") ?? "").trim();
  if (!provided) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { secret?: string } | null; error: unknown }> };
        };
      };
    })
      .from("cron_secrets")
      .select("secret")
      .eq("name", "webhook")
      .maybeSingle();

    const expected = (!error && data?.secret ? data.secret : "").trim();
    if (!expected || !timingSafeEqual(provided, expected)) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    return null;
  } catch {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
}
