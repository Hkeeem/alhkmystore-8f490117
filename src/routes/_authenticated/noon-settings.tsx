import { createFileRoute, Link } from "@tanstack/react-router";
import { History, ShieldCheck } from "lucide-react";
import { NoonSyncSettingsPanel } from "@/components/admin/NoonSyncSettingsPanel";
import { NoonApiKeysPanel } from "@/components/admin/NoonApiKeysPanel";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/noon-settings")({
  component: NoonSettingsPage,
  head: () => ({
    meta: [
      { title: "إعدادات نون | حكيم AI" },
      {
        name: "description",
        content:
          "اربط واجهة أفلييت نون الرسمية بمفاتيح API لسحب عروض نون تلقائياً ودمجها مع عروض التجّار داخل حكيم AI.",
      },
      { property: "og:title", content: "إعدادات نون | حكيم AI" },
      {
        property: "og:description",
        content: "مفاتيح واجهة أفلييت نون، حالة الحملة، والمزامنة التلقائية للعروض.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function NoonSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24 md:pb-10" dir="rtl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-xl font-black">
          <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
          إعدادات نون
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/sync-log">
            <History className="size-4" aria-hidden="true" />
            سجل المزامنة
          </Link>
        </Button>
      </div>

      <NoonApiKeysPanel />
      <NoonSyncSettingsPanel />

      <p className="text-xs text-muted-foreground">
        عند حفظ مفاتيح واجهة الأفلييت الرسمية تُسحب عروض نون تلقائياً في كل مزامنة وتُدمج مع عروض
        التجّار في «كل العروض». إذا فشلت الواجهة الرسمية يستمر الكتالوج العام كخيار احتياطي دون
        تعطيل العروض القديمة.
      </p>
    </div>
  );
}
