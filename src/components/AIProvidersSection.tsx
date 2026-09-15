import { Header } from "@/components/Header";
import { AIProvidersSection } from "@/components/AIProvidersSection"; // المكون الجديد الذي يضم الأيقونات
import { OffersSection } from "@/components/OffersSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 1. الهيدر العلوي */}
      <Header />

      {/* 2. شريط مساعدي الذكاء الاصطناعي (Gemini, ChatGPT, Claude, Meta, Manus, Grok) */}
      <AIProvidersSection />

      {/* 3. باقي أقسام التطبيق والعروض */}
      <main className="flex-1 p-4 space-y-4">
        <OffersSection />
      </main>
    </div>
  );
}
