import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Role = "super_admin" | "admin" | "support" | "content_manager" | "user";

const STAFF: Role[] = ["super_admin", "admin", "support", "content_manager"];

async function getMyRoles(supabase: any, userId: string): Promise<Role[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return ((data as { role: Role }[] | null) ?? []).map((r) => r.role);
}

async function requireAny(supabase: any, userId: string, roles: Role[]) {
  const mine = await getMyRoles(supabase, userId);
  if (!mine.some((r) => roles.includes(r))) throw new Error("forbidden");
  return mine;
}

export const getAdminContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getMyRoles(context.supabase, context.userId);
    const isStaff = roles.some((r) => STAFF.includes(r));
    return { roles, isStaff, userId: context.userId };
  });

export const claimSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_super_admin");
    if (error) throw new Error(error.message);
    return { claimed: !!data };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAny(context.supabase, context.userId, STAFF);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [users, complaintsOpen, suggestions, premiumActive] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),
      supabaseAdmin.from("complaints").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabaseAdmin.from("suggestions").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("premium_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);
    return {
      users: (users.data as { total?: number } | null)?.total ?? users.data?.users?.length ?? 0,
      complaintsOpen: complaintsOpen.count ?? 0,
      suggestions: suggestions.count ?? 0,
      premiumActive: premiumActive.count ?? 0,
    };
  });

export const listComplaints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAny(context.supabase, context.userId, ["super_admin", "admin", "support"]);
    const { data, error } = await context.supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.string().nullable(),
      response: z.string().nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAny(context.supabase, context.userId, ["super_admin", "admin", "support"]);
    const patch: { status?: string; response?: string | null } = {};
    if (data.status) patch.status = data.status;
    if (data.response !== null) patch.response = data.response;
    const { error } = await context.supabase.from("complaints").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAny(context.supabase, context.userId, ["super_admin", "admin", "content_manager"]);
    const { data, error } = await context.supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.string().nullable(),
      tag: z.string().nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAny(context.supabase, context.userId, ["super_admin", "admin", "content_manager"]);
    const patch: { status?: string; tag?: string | null } = {};
    if (data.status) patch.status = data.status;
    if (data.tag !== null) patch.tag = data.tag;
    const { error } = await context.supabase.from("suggestions").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAny(context.supabase, context.userId, ["super_admin", "admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: authRes }, { data: rolesRows }, { data: profiles }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("profiles").select("id, display_name, avatar_url"),
    ]);
    const rolesByUser = new Map<string, string[]>();
    (rolesRows ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    const profByUser = new Map<string, any>();
    (profiles ?? []).forEach((p: any) => profByUser.set(p.id, p));
    return (authRes?.users ?? []).map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      display_name: profByUser.get(u.id)?.display_name ?? null,
      avatar_url: profByUser.get(u.id)?.avatar_url ?? null,
      roles: rolesByUser.get(u.id) ?? [],
    }));
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["super_admin", "admin", "support", "content_manager", "user"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("assign_user_role", {
      _target: data.userId,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["super_admin", "admin", "support", "content_manager", "user"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("revoke_user_role", {
      _target: data.userId,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPremium = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAny(context.supabase, context.userId, ["super_admin", "admin"]);
    const { data, error } = await context.supabase
      .from("premium_subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const broadcastNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      title: z.string().min(1).max(200),
      body: z.string().max(1000).nullable(),
      link: z.string().max(500).nullable(),
      targetUserId: z.string().uuid().nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAny(context.supabase, context.userId, ["super_admin", "admin", "content_manager"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.targetUserId) {
      const { error } = await supabaseAdmin.from("notifications").insert({
        user_id: data.targetUserId,
        title: data.title,
        body: data.body,
        link: data.link,
      });
      if (error) throw new Error(error.message);
      return { ok: true, count: 1 };
    }
    // broadcast to all users
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const rows = (users?.users ?? []).map((u: any) => ({
      user_id: u.id,
      title: data.title,
      body: data.body,
      link: data.link,
      is_broadcast: true,
    }));
    if (rows.length === 0) return { ok: true, count: 0 };
    const { error } = await supabaseAdmin.from("notifications").insert(rows);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "broadcast_notification",
      target_table: "notifications",
      meta: { title: data.title, count: rows.length },
    });
    return { ok: true, count: rows.length };
  });

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAny(context.supabase, context.userId, ["super_admin", "admin"]);
    const { data, error } = await context.supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Public: submit complaint / suggestion (user-scoped)
export const submitComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ subject: z.string().min(3).max(200), body: z.string().min(5).max(2000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("complaints").insert({
      user_id: context.userId,
      subject: data.subject,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ subject: z.string().min(3).max(200), body: z.string().min(5).max(2000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("suggestions").insert({
      user_id: context.userId,
      subject: data.subject,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
