import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Percent, Handshake, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sync-partners")({
  head: () => ({
    meta: [
      { title: "سجل المزامنة والمتاجر الشريكة — حكيم AI" },
      {
        name: "description",
        content:
          "شرح لكل متجر في سجل المزامنة: رابط التسجيل في برنامج الأفلييت، اسم الشريك أو الشبكة، وتكلفة الإحالة (نسبة العمولة).",
      },
      { property: "og:title", content: "سجل المزامنة والمتاجر الشريكة — حكيم AI" },
      {
        property: "og:description",
        content: "دليل المتاجر المرتبطة بالمزامنة: روابط التسجيل، الشركاء، ونسب العمولة.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SyncPartnersPage,
});

type Partner = {
  store: string;
  network: string;
  signupUrl: string;
  signupLabel: string;
  commission: string;
  syncMode: string;
  note: string;
};

const PARTNERS: Partner[] = [
  {
    store: "أمازون السعودية",
    network: "Amazon Associates (مباشر)",
    signupUrl: "https://affiliate-program.amazon.sa/",
    signupLabel: "affiliate-program.amazon.sa",
    commission: "١٪ – ١٠٪ حسب التصنيف",
    syncMode: "تلقائية عبر PA-API بعد اعتماد ٣ مبيعات",
    note: "تحتاج Access Key و Secret Key ومعرّف الشريك (Partner Tag).",
  },
  {
    store: "نون",
    network: "noon Affiliate (كود HKM11)",
    signupUrl: "https://www.noon.com/saudi-ar/",
    signupLabel: "noon.com",
    commission: "٢٪ – ٨٪ + كود خصم للعميل",
    syncMode: "روابط ترويجية مباشرة + تحديث يدوي/دوري",
    note: "الحساب الحالي يعتمد على كود الخصم HKM11 وليس مفاتيح API.",
  },
  {
    store: "جرير",
    network: "Admitad / ArabyAds",
    signupUrl: "https://www.admitad.com/",
    signupLabel: "admitad.com",
    commission: "١٪ – ٤٪",
    syncMode: "تغذية منتجات (Feed) عبر بوت المتاجر",
    note: "رابط التغذية يصدر من لوحة الناشر بعد قبول الحملة.",
  },
  {
    store: "إكسترا",
    network: "Boostiny",
    signupUrl: "https://boostiny.com/",
    signupLabel: "boostiny.com",
    commission: "١٪ – ٣٪",
    syncMode: "تغذية منتجات (Feed) عبر بوت المتاجر",
    note: "يلزم اعتماد الحملة قبل استخراج رابط التغذية.",
  },
  {
    store: "نمشي",
    network: "ArabyAds / Admitad",
    signupUrl: "https://arabyads.com/",
    signupLabel: "arabyads.com",
    commission: "٤٪ – ١٠٪",
    syncMode: "تغذية منتجات + كوبونات",
    note: "العمولة أعلى على العملاء الجدد.",
  },
  {
    store: "نايس ون",
    network: "Impact / ArabyAds",
    signupUrl: "https://impact.com/",
    signupLabel: "impact.com",
    commission: "٥٪ – ١٢٪",
    syncMode: "روابط + كوبونات",
    note: "قطاع الجمال عادةً بأعلى نسب عمولة.",
  },
  {
    store: "فلاورد",
    network: "Boostiny / Impact",
    signupUrl: "https://boostiny.com/",
    signupLabel: "boostiny.com",
    commission: "٦٪ – ١٠٪",
    syncMode: "روابط + كوبونات موسمية",
    note: "العروض الموسمية تنتهي سريعًا، يُفضل التحديث اليومي.",
  },
];

function SyncPartnersPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-5 space-y-4" dir="rtl">
      <header className="space-y-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Handshake className="w-5 h-5 text-primary" />
          سجل المزامنة — المتاجر الشريكة
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          شرح لكل متجر مرتبط بالمزامنة: رابط التسجيل في برنامج الأفلييت، اسم الشريك أو الشبكة
          الوسيطة، وتكلفة الإحالة (نسبة العمولة) وطريقة جلب العروض.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm" variant="secondary">
            <Link to="/affiliate-setup">
              <RefreshCw className="w-4 h-4 ml-1" />
              دليل التفعيل خطوة بخطوة
            </Link>
          </Button>
        </div>
      </header>

      <ul className="space-y-3">
        {PARTNERS.map((p) => (
          <li key={p.store}>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span>{p.store}</span>
                  <Badge variant="outline" className="text-[11px] font-normal">
                    <Percent className="w-3 h-3 ml-1" />
                    {p.commission}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <p>
                  <span className="text-muted-foreground">الشريك: </span>
                  {p.network}
                </p>
                <p>
                  <span className="text-muted-foreground">طريقة المزامنة: </span>
                  {p.syncMode}
                </p>
                <p className="text-muted-foreground text-[13px] leading-relaxed">{p.note}</p>
                <a
                  href={p.signupUrl}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary font-medium text-[13px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  التسجيل: {p.signupLabel}
                </a>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <p className="text-[12px] text-muted-foreground leading-relaxed">
        النسب المذكورة تقديرية وتتغير حسب التصنيف والحملة؛ النسبة النهائية تظهر في لوحة الشريك بعد
        اعتماد الحساب.
      </p>
    </main>
  );
}
