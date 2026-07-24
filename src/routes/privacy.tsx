import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية | Hkeeem AI" },
      {
        name: "description",
        content: "سياسة الخصوصية الخاصة بتطبيق Hkeeem AI",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">سياسة الخصوصية</h1>

      <p className="mb-4">
        يلتزم تطبيق Hkeeem AI بحماية خصوصية المستخدمين والحفاظ على بياناتهم.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        البيانات التي نجمعها
      </h2>

      <ul className="list-disc mr-6 space-y-2">
        <li>البريد الإلكتروني.</li>
        <li>الاسم (اختياري).</li>
        <li>الموقع الجغرافي بعد موافقة المستخدم.</li>
        <li>معلومات الجهاز.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        استخدام البيانات
      </h2>

      <p>
        تُستخدم البيانات لتحسين تجربة المستخدم، وتشغيل خدمات الذكاء الاصطناعي،
        وعرض العروض القريبة.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        التواصل
      </h2>

      <p>alhkmy11@gmail.com</p>
    </main>
  );
}
