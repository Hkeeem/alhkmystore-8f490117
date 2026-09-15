import { Header } from "@/components/Header";
import { AIProvidersSection } from "@/components/AIProvidersSection";
import { HkeeemOffersSection } from "@/components/HkeeemOffersSection";

export default function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* 1. الهيدر العلوي */}
      <Header />

      {/* 2. شريط مساعدي الذكاء الاصطناعي تحت الهيدر مباشرة */}
      <AIProvidersSection />

      {/* 3. باقي أقسام التطبيق وعروض المنصة */}
      <main className="flex-1 p-4 space-y-4">
        <HkeeemOffersSection />
      </main>
    </div>
  );
}
