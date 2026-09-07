import { createFileRoute, Link } from "@tanstack/react-router";
import { SocialOffersSection } from "@/components/SocialOffersSection";
import { useSocialOffers } from "@/hooks/use-social-offers";

export const Route = createFileRoute("/social-offers")({
  head: () => ({
    meta: [
      { title: "عروض السوشال ميديا | حكيم AI" },
      {
        name: "description",
        content:
          "أقوى عروض المتاجر السعودية على سناب شات وتيك توك وإنستغرام وX ويوتيوب وتيليجرام، مرتبة حسب نشاط المتجر واهتماماتك.",
      },
      { property: "og:title", content: "عروض السوشال ميديا | حكيم AI" },
      {
        property: "og:description",
        content: "تابع عروض المتاجر مباشرة من قنواتها الرسمية في السوشال ميديا.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SocialOffersPage,
});

function SocialOffersPage() {
  const { data: live, isLoading, isError } = useSocialOffers(40);

  return (
    <div className="container mx-auto px-4 py-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-black">عروض السوشال ميديا</h1>
        <Link
          to="/sync-log"
          className="rounded-xl bg-primary/10 border border-primary/30 text-primary px-3 py-1.5 text-[12px] font-black"
        >
          + أضف حساباتي
        </Link>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-black">عروض محدّثة تلقائيًا من حساباتنا</h2>
        {isLoading && <p className="text-[12px] text-muted-foreground">جارٍ التحديث…</p>}
        {isError && <p className="text-[12px] text-destructive">تعذّر تحميل العروض المحدثة — جرّب لاحقًا.</p>}
        {!isLoading && !isError && (live?.length ?? 0) === 0 && (
          <div className="border border-dashed border-primary/30 rounded-2xl p-4 text-center space-y-2">
            <p className="text-[12px] text-muted-foreground">لم تُضف حسابات بعد.</p>
            <Link
              to="/sync-log"
              className="inline-block rounded-xl bg-gradient-gold text-secondary px-4 py-2 text-[13px] font-black"
            >
              أضف حساباتي من سجل المزامنة
            </Link>
          </div>
        )}
        <ul className="grid gap-2 sm:grid-cols-2">
          {(live ?? []).map((offer) => {
            const expiry = offer.expires_at ? new Date(offer.expires_at) : null;
            const lastDay = expiry ? expiry.getTime() - Date.now() <= 86400000 : false;
            return (
              <li key={offer.id} className="border border-border/60 rounded-2xl p-3 bg-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-primary">
                    {offer.platform} · @{offer.handle}
                  </span>
                  {expiry && (
                    <span className={`text-[10px] font-black ${lastDay ? "text-destructive" : "text-muted-foreground"}`}>
                      {lastDay ? "⏰ آخر يوم للعرض" : `ينتهي ${expiry.toLocaleDateString("ar-SA")}`}
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-bold mt-1 line-clamp-2">{offer.title}</p>
                {offer.price != null && (
                  <p className="text-[13px] font-black text-primary mt-1">
                    {offer.price} ر.س{" "}
                    {offer.original_price != null && (
                      <span className="text-[11px] text-muted-foreground line-through">{offer.original_price} ر.س</span>
                    )}
                  </p>
                )}
                {offer.coupon_code && (
                  <p className="text-[11px] font-black mt-1">كود: {offer.coupon_code}</p>
                )}
                {offer.post_url && (
                  <a
                    href={offer.post_url}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    className="inline-block mt-2 text-[12px] font-black text-primary"
                  >
                    فتح المنشور ↗
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <SocialOffersSection />
    </div>
  );
}
