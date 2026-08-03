import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Download, Trash2, Eye, EyeOff, Upload, RefreshCw } from "lucide-react";
import {
  listExternalDeals,
  importExternalDeals,
  toggleExternalDeal,
  deleteExternalDeal,
  crawlDealsNow,
} from "@/lib/deals-admin.functions";

const TEMPLATE =
  "store_id,store_name,title,category,unit,original_price,price,image_url,product_url\n" +
  "othaim,أسواق العثيم,أرز بسمتي 10 كجم,سوبرماركت,10 كجم,89,45,,https://othaimmarkets.com";

type ParsedRow = {
  store_id: string;
  store_name: string;
  title: string;
  category: string;
  unit?: string;
  original_price: number;
  price: number;
  image_url?: string;
  product_url?: string;
};

function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  const rows: ParsedRow[] = [];
  if (lines.length === 0) return { rows, errors: ["الملف فارغ"] };

  const start = lines[0]!.includes("store_id") ? 1 : 0;
  for (let i = start; i < lines.length; i++) {
    const cols = lines[i]!.split(",").map((c) => c.trim());
    const [store_id, store_name, title, category, unit, original, price, image_url, product_url] = cols;
    const op = Number(original);
    const p = Number(price);
    if (!store_id || !store_name || !title || !category || !Number.isFinite(op) || !Number.isFinite(p) || p <= 0) {
      errors.push(`السطر ${i + 1}: بيانات ناقصة أو سعر غير صالح`);
      continue;
    }
    rows.push({
      store_id,
      store_name,
      title,
      category,
      unit: unit || undefined,
      original_price: op > p ? op : p,
      price: p,
      image_url: image_url || undefined,
      product_url: product_url || undefined,
    });
  }
  return { rows, errors };
}

export function DealsSourceTab() {
  const qc = useQueryClient();
  const [csv, setCsv] = useState("");

  const list = useServerFn(listExternalDeals);
  const importFn = useServerFn(importExternalDeals);
  const toggleFn = useServerFn(toggleExternalDeal);
  const deleteFn = useServerFn(deleteExternalDeal);
  const crawlFn = useServerFn(crawlDealsNow);

  const dealsQ = useQuery({ queryKey: ["admin-external-deals"], queryFn: () => list({}) });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-external-deals"] });
    qc.invalidateQueries({ queryKey: ["real-deals"] });
  };

  const importM = useMutation({
    mutationFn: (rows: ParsedRow[]) => importFn({ data: { rows } }),
    onSuccess: (r) => {
      toast.success(`تم استيراد ${r.inserted} عرض`);
      setCsv("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const crawlM = useMutation({
    mutationFn: () => crawlFn({ data: {} }),
    onSuccess: (r) => {
      const failed = r.results.filter((x) => x.error);
      if (r.total > 0) toast.success(`تم سحب ${r.total} عرض حقيقي`);
      if (failed.some((f) => f.error === "FIRECRAWL_NOT_CONFIGURED")) {
        toast.error("السحب الآلي يحتاج تفعيل خدمة Firecrawl أولاً");
      } else if (failed.length > 0) {
        toast.warning(`تعذّر السحب من: ${failed.map((f) => f.source).join("، ")}`);
      }
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleM = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => toggleFn({ data: v }),
    onSuccess: invalidate,
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      invalidate();
    },
  });

  function handleImport() {
    const { rows, errors } = parseCsv(csv);
    if (errors.length > 0) toast.warning(errors.slice(0, 3).join(" | "));
    if (rows.length === 0) return;
    importM.mutate(rows);
  }

  const rows = dealsQ.data ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-primary/20 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold">السحب الآلي من مواقع المتاجر</h2>
            <p className="text-xs text-muted-foreground mt-1">
              جرير، إكسترا، نون، بنده، العثيم، النهدي — تُحدَّث العروض وتُخزَّن مباشرة.
            </p>
          </div>
          <button
            onClick={() => crawlM.mutate()}
            disabled={crawlM.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60"
          >
            {crawlM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            تحديث العروض الآن
          </button>
        </div>
        {crawlM.data && (
          <ul className="text-xs text-muted-foreground space-y-1">
            {crawlM.data.results.map((r) => (
              <li key={r.source}>
                {r.source}: {r.error ? `تعذّر (${r.error.slice(0, 60)})` : `${r.saved} عرض`}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-bold">استيراد يدوي (CSV)</h2>
          <button
            onClick={() => setCsv(TEMPLATE)}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Download className="w-3.5 h-3.5" /> إدراج قالب جاهز
          </button>
        </div>
        <textarea
          dir="ltr"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={7}
          placeholder={TEMPLATE}
          className="w-full bg-background border border-border rounded-xl p-3 text-xs font-mono outline-none focus:border-primary"
        />
        <button
          onClick={handleImport}
          disabled={importM.isPending || csv.trim().length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 text-primary text-sm font-bold disabled:opacity-50"
        >
          {importM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          استيراد العروض
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">العروض المخزّنة ({rows.length})</h2>
        {dealsQ.isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        {!dealsQ.isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">لا توجد عروض بعد — استعمل السحب الآلي أو الاستيراد اليدوي.</p>
        )}
        <div className="space-y-2">
          {rows.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="font-bold line-clamp-1">{d.title}</div>
                <div className="text-xs text-muted-foreground">
                  {d.store_name ?? d.store_id} · {d.price} ر.س بدل {d.original_price} · خصم {d.discount_percent}٪ ·{" "}
                  {d.source}
                </div>
              </div>
              <button
                onClick={() => toggleM.mutate({ id: d.id, active: !d.active })}
                className="p-2 rounded-lg hover:bg-muted"
                title={d.active ? "إخفاء" : "إظهار"}
              >
                {d.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              </button>
              <button
                onClick={() => deleteM.mutate(d.id)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
