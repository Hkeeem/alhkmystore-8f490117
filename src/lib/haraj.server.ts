/**
 * تسوّق حكيم: محاولة جلب أبرز الإعلانات المميزة من حراج كل ساعتين.
 * إذا رفض المصدر الطلب نُبقي آخر إعلانات محفوظة ونسجّل الحدث فقط،
 * ويمكن لفريق العمل إضافة إعلانات مميزة يدوياً من لوحة الإدارة.
 */

const ENDPOINT = "https://graphql.haraj.com.sa/";

type HarajItem = {
  id?: number | string;
  title?: string;
  bodyTEXT?: string;
  city?: string;
  authorUsername?: string;
  thumbURL?: string;
  postDate?: number | string;
};

async function fetchHaraj(limit: number): Promise<HarajItem[]> {
  const body = {
    query: `query Search($limit: Int) { search(limit: $limit) { items { id title bodyTEXT city authorUsername thumbURL postDate } } }`,
    variables: { limit },
  };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      origin: "https://haraj.com.sa",
      referer: "https://haraj.com.sa/",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`haraj_http_${res.status}`);
  const text = await res.text();
  if (!text.trim()) throw new Error("haraj_empty_response");
  const json = JSON.parse(text) as { data?: { search?: { items?: HarajItem[] } } };
  return json.data?.search?.items ?? [];
}

export async function runHarajSync(limit = 5) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();

  let items: HarajItem[] = [];
  let failure: string | null = null;
  try {
    items = await fetchHaraj(limit);
  } catch (error) {
    failure = error instanceof Error ? error.message : "haraj_failed";
  }

  const rows = items
    .filter((i) => i.id && i.title)
    .slice(0, limit)
    .map((i, index) => ({
      source_key: `haraj:${i.id}`,
      title: String(i.title).slice(0, 200),
      description: i.bodyTEXT ? String(i.bodyTEXT).slice(0, 600) : null,
      image_url: i.thumbURL ?? null,
      post_url: `https://haraj.com.sa/${i.id}/`,
      price: null,
      city: i.city ?? null,
      author: i.authorUsername ?? null,
      posted_at: i.postDate ? new Date(Number(i.postDate) * 1000).toISOString() : null,
      rank: index + 1,
      active: true,
      fetched_at: now,
    }));

  if (rows.length) {
    const { error } = await supabaseAdmin
      .from("haraj_listings")
      .upsert(rows, { onConflict: "source_key" });
    if (error) throw new Error(error.message);
    const keep = rows.map((r) => `"${r.source_key}"`).join(",");
    await supabaseAdmin
      .from("haraj_listings")
      .update({ active: false })
      .not("source_key", "in", `(${keep})`)
      .like("source_key", "haraj:%");
  }

  await supabaseAdmin.from("sync_events").insert({
    source: "haraj",
    status: failure ? "error" : rows.length ? "success" : "empty",
    code: failure ?? null,
    message: failure
      ? "تعذّر الوصول إلى حراج، أبقينا آخر إعلانات محفوظة"
      : `تسوّق حكيم: ${rows.length} إعلان`,
  });

  return { count: rows.length, failure };
}
