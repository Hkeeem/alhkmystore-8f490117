import type { Deal } from "@/data/deals";

function normalizeTitle(title: string) {
  return title
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

/** مفتاح تجميع المنتج: مفتاح المنتج إن وُجد، وإلا الاسم المطبّع */
function groupKey(d: Deal) {
  return d.productKey?.trim() || normalizeTitle(d.title);
}

/**
 * مجموعات المقارنة الحية: نفس المنتج في أكثر من متجر، مرتّبة من الأرخص.
 */
export function liveComparableGroups(deals: Deal[], max = 3): Deal[][] {
  const map = new Map<string, Deal[]>();
  for (const d of deals) {
    if (!Number.isFinite(d.price)) continue;
    const key = groupKey(d);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(d);
    map.set(key, list);
  }

  return [...map.values()]
    .map((g) => {
      const seen = new Set<string>();
      return g
        .filter((d) => {
          if (seen.has(d.storeId)) return false;
          seen.add(d.storeId);
          return true;
        })
        .sort((a, b) => a.price - b.price);
    })
    .filter((g) => g.length > 1)
    .sort((a, b) => b[a.length - 1]!.price - b[0]!.price - (a[a.length - 1]!.price - a[0]!.price))
    .slice(0, max);
}
