import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  p256dh: z.string().min(10).max(400),
  auth: z.string().min(4).max(200),
  userAgent: z.string().max(400).optional(),
});

const endpointSchema = z.object({ endpoint: z.string().url().max(1000) });

/** Public: the VAPID application server key the browser needs to subscribe. */
export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const { vapidPublicKey } = await import("./push.server");
  const key = vapidPublicKey();
  return { publicKey: key, configured: Boolean(key) };
});

/** Stores (or refreshes) a browser push subscription. */
export const savePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => subscriptionSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      {
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent ?? null,
        failure_count: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return { saved: true };
  });

/** Removes a subscription when the user turns push off. */
export const removePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => endpointSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", data.endpoint);
    return { removed: true };
  });

/** Sends a real push to one known subscription so the user can verify delivery. */
export const sendTestPush = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => endpointSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendPush } = await import("./push.server");

    const { data: sub } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("endpoint", data.endpoint)
      .maybeSingle();

    if (!sub) return { sent: false, reason: "not_subscribed" as const };

    const result = await sendPush(sub as any, {
      title: "حكيم AI",
      body: "تم تفعيل إشعارات العروض بنجاح ✅ — سنرسل لك أقوى العروض وانخفاضات الأسعار.",
      url: "/notifications",
    });

    if (result.gone) {
      await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", data.endpoint);
      return { sent: false, reason: "expired" as const };
    }
    if (!result.ok)
      return { sent: false, reason: "push_service_error" as const, status: result.status };

    await supabaseAdmin
      .from("push_subscriptions")
      .update({ last_success_at: new Date().toISOString(), failure_count: 0 })
      .eq("endpoint", data.endpoint);

    return { sent: true, reason: "ok" as const };
  });
