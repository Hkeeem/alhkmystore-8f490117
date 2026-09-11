import { createFileRoute } from "@tanstack/react-router";
import { HkeeemOffersSection } from "@/components/HkeeemOffersSection";

export const Route = createFileRoute("/hkeeem-shopping")({
  head: () => ({ meta: [{ title: "تسوّق حكيم — HkeeemAI" }] }),
  component: HkeeemShoppingPage,
});

function HkeeemShoppingPage() {
  return (
    <main dir="rtl" className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <header>
        <p className="text-sm font-bold text-primary">HkeeemAI</p>
        <h1 className="text-3xl font-black">تسوّق حكيم</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          تصفّح عروضًا ذكية من مصادر حكيم، وقارن السعر قبل الشراء.
        </p>
      </header>
      <HkeeemOffersSection />
    </main>
  );
}
