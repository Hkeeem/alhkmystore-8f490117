import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIndexingTrend, listCrawlSnapshots } from "@/lib/search-console.functions";

type Snapshot = {
  id: string;
  site_url: string | null;
  submitted: number | null;
  indexed: number | null;
  sitemap_errors: number | null;
  sitemap_warnings: number | null;
  inspected_urls: number | null;
  indexed_urls: number | null;
  details: unknown;
  created_at: string;
};

const HEADERS = [
  "التاريخ",
  "نوع الفحص",
  "الموقع",
  "روابط مُرسلة",
  "روابط مفهرسة",
  "صفحات مفحوصة",
  "صفحات مفهرسة",
  "أخطاء الخريطة",
  "تحذيرات الخريطة",
];

function fmt(value: string) {
  return new Date(value).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
}

function mode(s: Snapshot) {
  return (s.details as { mode?: string } | null)?.mode === "url_inspection"
    ? "فحص URL"
    : "فحص شامل";
}

function toRow(s: Snapshot) {
  return [
    fmt(s.created_at),
    mode(s),
    s.site_url ?? "—",
    s.submitted ?? 0,
    s.indexed ?? 0,
    s.inspected_urls ?? 0,
    s.indexed_urls ?? 0,
    s.sitemap_errors ?? 0,
    s.sitemap_warnings ?? 0,
  ];
}

function downloadCsv(rows: Snapshot[]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const body = [HEADERS, ...rows.map(toRow)].map((r) => r.map(escape).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `search-console-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function openPdf(
  rows: Snapshot[],
  trend: { day: string; indexedUrls: number; crawled: number; submitted: number }[],
) {
  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) {
    toast.error("تعذّر فتح نافذة التقرير — يرجى السماح بالنوافذ المنبثقة.");
    return;
  }
  const table = (head: string[], body: (string | number)[][]) => `
    <table>
      <thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;

  win.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8" />
  <title>تقرير الزحف والفهرسة — حكيم AI</title>
  <style>
    body{font-family:'Cairo',system-ui,sans-serif;padding:28px;color:#1c1917}
    h1{font-size:20px;margin:0 0 4px}
    p.sub{color:#78716c;font-size:12px;margin:0 0 20px}
    h2{font-size:15px;margin:24px 0 8px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #d6d3d1;padding:6px;text-align:right}
    th{background:#f5f5f4}
    @media print{@page{size:A4 landscape;margin:12mm}}
  </style></head><body>
  <h1>تقرير الزحف والفهرسة — حكيم AI</h1>
  <p class="sub">تاريخ التوليد: ${fmt(new Date().toISOString())}</p>
  <h2>اتجاه الفهرسة (آخر 30 يوماً)</h2>
  ${
    trend.length
      ? table(
          ["اليوم", "صفحات مفهرسة", "روابط مفهرسة (الخريطة)", "روابط مُرسلة"],
          trend.map((t) => [t.day, t.indexedUrls, t.crawled, t.submitted]),
        )
      : "<p>لا توجد بيانات خلال آخر 30 يوماً.</p>"
  }
  <h2>سجل الفحوصات</h2>
  ${rows.length ? table(HEADERS, rows.map(toRow)) : "<p>لا توجد فحوصات محفوظة.</p>"}
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

export function SearchConsoleExport() {
  const fetchSnapshots = useServerFn(listCrawlSnapshots);
  const fetchTrend = useServerFn(getIndexingTrend);

  const snapshots = useQuery({
    queryKey: ["sc-snapshots"],
    queryFn: () => fetchSnapshots({ data: undefined }),
  });
  const trend = useQuery({
    queryKey: ["sc-trend"],
    queryFn: () => fetchTrend({ data: undefined }),
  });

  const rows = (snapshots.data ?? []) as unknown as Snapshot[];
  const busy = snapshots.isLoading || trend.isLoading;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" />
          تقرير تلقائي قابل للتنزيل
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          يولّد التقرير ملفاً يجمع سجل الفحوصات السابقة وبيانات الفهرسة واتجاهها خلال آخر 30 يوماً،
          جاهزاً للحفظ أو المشاركة مع الفريق.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy || rows.length === 0}
            onClick={() => {
              downloadCsv(rows);
              toast.success("تم تنزيل تقرير CSV");
            }}
          >
            <Download className="ml-2 h-4 w-4" />
            تنزيل CSV
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              openPdf(
                rows,
                (trend.data ?? []) as {
                  day: string;
                  indexedUrls: number;
                  crawled: number;
                  submitted: number;
                }[],
              )
            }
          >
            <FileText className="ml-2 h-4 w-4" />
            تنزيل PDF
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          عند اختيار PDF تُفتح نافذة التقرير مباشرة مع مربع الطباعة — اختر «حفظ كـ PDF» لتنزيل
          الملف.
        </p>
      </CardContent>
    </Card>
  );
}
