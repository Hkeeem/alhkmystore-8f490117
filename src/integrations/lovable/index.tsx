import React from "react";

// كائن وهمي لكي يتوافق مع الاستيراد في ملف auth.tsx
export const lovable = {
  init: () => {},
  auth: {},
};

export function LovableIntegrationView() {
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <header className="p-4 border-b border-border/40">
        <h1 className="text-lg font-bold">لوحة تكاملات Lovable</h1>
      </header>
      <main className="flex-1 p-6">
        <p className="text-muted-foreground text-sm">التكاملات والأدوات تعمل بكفاءة عالية ضمن بيئة المنصة.</p>
      </main>
    </div>
  );
}

export default LovableIntegrationView;
