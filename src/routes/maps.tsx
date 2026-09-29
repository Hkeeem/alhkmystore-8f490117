import { createFileRoute } from "@tanstack/react-router";
import { MapsHub } from "@/components/MapsHub";

export const Route = createFileRoute("/maps")({
  validateSearch: (search: Record<string, unknown>) => ({
    deal: typeof search.deal === "string" ? search.deal : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Hkeeem Map — خريطة العروض القريبة منك" },
      {
        name: "description",
        content:
          "Hkeeem Map: خريطتك التفاعلية لاستكشاف مواقع المتاجر والعروض في المملكة، مع أنواع خرائط متعددة وتوجيه مباشر.",
      },
      { property: "og:title", content: "Hkeeem Map — خريطة العروض القريبة منك" },
      {
        property: "og:description",
        content: "استكشف الخريطة بأنواعها الثلاثة وابدأ التوجيه المباشر من موقعك.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alhkmystore.lovable.app/maps" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://alhkmystore.lovable.app/maps" }],
  }),
  component: MapsHub,
});
