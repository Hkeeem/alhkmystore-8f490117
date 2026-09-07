import { createFileRoute } from "@tanstack/react-router";
import { SocialOffersSection } from "@/components/SocialOffersSection";

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
  return (
    <div className="container mx-auto px-4 py-4 space-y-4" dir="rtl">
      <h1 className="text-lg font-black">عروض السوشال ميديا</h1>
      <SocialOffersSection />
    </div>
  );
}
