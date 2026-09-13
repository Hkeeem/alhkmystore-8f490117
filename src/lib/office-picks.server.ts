/**
 * مكتب حكيم: تحديث أسبوعي (كل أحد) لأفضل 5 عقارات وأفضل 5 مطوّرين معتمدين.
 * المصدر: إعلانات العقار النشطة وتجّار العقار الموثّقون في قاعدة البيانات.
 */

export async function runOfficePicksSync(limit = 5) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();

  const [props, devs] = await Promise.all([
    supabaseAdmin
      .from("real_estate_listings" as never)
      .select("id, title, city, district, property_type, status, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(60),
    supabaseAdmin
      .from("merchants")
      .select("id, name, slug, city, description, logo_url, website, category, created_at")
      .eq("status", "verified")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  type ListingRow = {
    id: string;
    title: string;
    city: string | null;
    district: string | null;
    property_type: string | null;
    created_at: string;
  };

  const properties = ((props.data ?? []) as unknown as ListingRow[])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
    .map((p, i) => ({
      kind: "property",
      source_key: p.id,
      title: p.title,
      subtitle: `${p.property_type ?? ""} · ${p.district ?? ""}`.trim(),
      image_url: null,
      link_url: "https://haraj.com.sa",
      price: null,
      city: p.city ?? null,
      rating: null,
      rank: i + 1,
      active: true,
      fetched_at: now,
    }));

  const developers = (devs.data ?? [])
    .filter((m) => (m.category ?? "").includes("عقار") || (m.description ?? "").includes("عقار"))
    .slice(0, limit)
    .map((m, i) => ({
      kind: "developer",
      source_key: m.id,
      title: m.name,
      subtitle: m.description ?? "مطوّر عقاري معتمد",
      image_url: m.logo_url ?? null,
      link_url: m.website ?? "/stores",
      price: null,
      city: m.city ?? null,
      rating: null,
      rank: i + 1,
      active: true,
      fetched_at: now,
    }));

  const rows = [...properties, ...developers];
  if (rows.length) {
    const { error } = await supabaseAdmin
      .from("office_picks")
      .upsert(rows, { onConflict: "kind,source_key" });
    if (error) throw new Error(error.message);
    const keep = rows.map((r) => `"${r.source_key}"`).join(",");
    await supabaseAdmin
      .from("office_picks")
      .update({ active: false })
      .not("source_key", "in", `(${keep})`);
  }

  await supabaseAdmin.from("sync_events").insert({
    source: "office-picks",
    status: rows.length ? "success" : "empty",
    message: `مكتب حكيم: ${properties.length} عقار و${developers.length} مطوّر`,
  });

  return { properties: properties.length, developers: developers.length };
}
