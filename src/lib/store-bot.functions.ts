import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (!data) throw new Error("Forbidden");
}

export const listStoreFeeds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const { data, error } = await context.supabase
      .from("store_feeds")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addStoreFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      store_name: string;
      feed_url: string;
      feed_type?: string;
      category?: string;
      affiliate_param?: string | null;
    }) => {
      const name = input.store_name?.trim();
      const url = input.feed_url?.trim();
      if (!name || name.length > 80) throw new Error("اسم المتجر مطلوب");
      if (!url || !/^https?:\/\//i.test(url)) throw new Error("رابط التغذية غير صالح");
      return {
        store_name: name,
        feed_url: url,
        feed_type:
          input.feed_type === "json" || input.feed_type === "xml" ? input.feed_type : "auto",
        category: (input.category?.trim() || "عام").slice(0, 60),
        affiliate_param: input.affiliate_param?.trim() || null,
      };
    },
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { error } = await context.supabase.from("store_feeds").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleStoreFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; active: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { error } = await context.supabase
      .from("store_feeds")
      .update({ active: data.active, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStoreFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { error } = await context.supabase.from("store_feeds").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const runStoreBotNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { feedId?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { runStoreBot } = await import("@/lib/store-bot.server");
    return runStoreBot(data.feedId);
  });
