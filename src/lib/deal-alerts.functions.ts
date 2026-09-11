import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DealAlertSettings = {
  enabled: boolean;
  lead_hours: number;
  coupons_enabled: boolean;
  coupon_window_hours: number;
  updated_at: string | null;
};

const DEFAULTS: DealAlertSettings = {
  enabled: true,
  lead_hours: 24,
  coupons_enabled: true,
  coupon_window_hours: 24,
  updated_at: null,
};

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (!data) throw new Error("Forbidden");
}

export const getDealAlertSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("deal_alert_settings")
      .select("enabled, lead_hours, coupons_enabled, coupon_window_hours, updated_at")
      .maybeSingle();
    return (data ?? DEFAULTS) as DealAlertSettings;
  });

export const updateDealAlertSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      enabled: boolean;
      lead_hours: number;
      coupons_enabled: boolean;
      coupon_window_hours: number;
    }) => {
      const clamp = (n: number) => Math.min(168, Math.max(1, Math.round(Number(n) || 24)));
      return {
        enabled: Boolean(input.enabled),
        coupons_enabled: Boolean(input.coupons_enabled),
        lead_hours: clamp(input.lead_hours),
        coupon_window_hours: clamp(input.coupon_window_hours),
      };
    },
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { error } = await context.supabase
      .from("deal_alert_settings")
      .update({ ...data, updated_by: context.userId })
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true, ...data };
  });

/** يشغّل مسح التنبيهات فورًا (نفس ما تشغّله المزامنة التلقائية). */
export const runDealAlertsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const { runDealPushSweep } = await import("@/lib/deal-push.server");
    return runDealPushSweep();
  });
