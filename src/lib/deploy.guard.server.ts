const STAFF = ["super_admin", "admin", "support", "content_manager"];

/** يتحقق أن المستخدم من فريق الإدارة قبل عرض بيانات النشر */
export async function assertStaff(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = ((data as { role: string }[] | null) ?? []).map((r) => r.role);
  if (!roles.some((r) => STAFF.includes(r))) throw new Error("forbidden");
  return roles;
}
