import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (!data) throw new Error("Forbidden");
}

export const listSocialAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const { data, error } = await context.supabase
      .from("social_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    platform: string;
    handle: string;
    display_name?: string | null;
    feed_url?: string | null;
    city?: string | null;
    lat?: number | null;
    lng?: number | null;
  }) => {
    const platform = input.platform?.trim().toLowerCase();
    const handle = input.handle?.trim().replace(/^@/, "");
    if (!platform) throw new Error("المنصة مطلوبة");
    if (!handle) throw new Error("اسم الحساب مطلوب");
    const feed = input.feed_url?.trim() || null;
    if (feed && !/^https?:\/\//i.test(feed)) throw new Error("رابط التغذية غير صالح");
    return {
      platform: platform.slice(0, 30),
      handle: handle.slice(0, 60),
      display_name: input.display_name?.trim() || null,
      feed_url: feed,
      city: input.city?.trim() || null,
      lat: typeof input.lat === "number" ? input.lat : null,
      lng: typeof input.lng === "number" ? input.lng : null,
    };
  })
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { error } = await context.supabase.from("social_accounts").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; active: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { error } = await context.supabase
      .from("social_accounts")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { error } = await context.supabase.from("social_accounts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const runSocialSyncNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { accountId?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { runSocialSync } = await import("@/lib/social-sync.server");
    return runSocialSync(data.accountId);
  });
