import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MarketingPostRow = {
  id: string;
  platform: string;
  title: string | null;
  content: string;
  link_url: string | null;
  status: string;
  error: string | null;
  published_at: string | null;
  created_at: string;
};

/** آخر منشورات بوتات التسويق — لفريق العمل فقط */
export const listMarketingPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("marketing_posts")
      .select("id, platform, title, content, link_url, status, error, published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return (data ?? []) as MarketingPostRow[];
  });
