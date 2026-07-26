import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { LegalPage, LegalSection, SUPPORT_EMAIL } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام — HkeeemAI" },
      { name: "description", content: "شروط استخدام تطبيق HkeeemAI: العروض والكوبونات والكاش باك والنقاط والمساعد الذكي." },
      { property: "og:title", content: "الشروط والأحكام — HkeeemAI" },
      { property: "og:description", content: "قواعد استخدام منصة HkeeemAI وحدود المسؤولية وسياسات الكاش باك والنقاط." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      icon={FileText}
      title="الشروط والأحكام"
      updated="يوليو 2026"
      intro="باستخدامك تطبيق HkeeemAI فإنك توافق على الشروط التالية. هذه الصفحة يديرها فريق HkeeemAI ويجوز تحديثها، وسنعرض تاريخ آخر تحديث في أعلى الصفحة."
    >
      <LegalSection title="١) طبيعة الخدمة">
        <p>
          HkeeemAI منصة تجمع العروض والكوبونات وتساعدك على المقارنة واتخاذ قرار شراء أفضل. نحن لسنا بائعًا ولا
          طرفًا في عملية الشراء التي تتم لدى المتجر.
        </p>
      </LegalSection>

      <LegalSection title="٢) دقة الأسعار والعروض">
        <p>
          الأسعار والعروض والكوبونات قد تتغير أو تنتهي لدى المتاجر في أي وقت. نبذل جهدًا لتحديث البيانات، لكن
          السعر المعتمد هو المعروض في صفحة المتجر عند إتمام الشراء.
        </p>
      </LegalSection>

      <LegalSection title="٣) الحساب">
        <p>
          أنت مسؤول عن صحة بياناتك وسرية بيانات دخولك وعن كل نشاط يتم عبر حسابك. يحق لنا إيقاف الحسابات التي
          تخالف الشروط أو تسيء استخدام الخدمة.
        </p>
      </LegalSection>

      <LegalSection title="٤) الكاش باك والنقاط والجوائز">
        <p>
          طلبات الكاش باك تمر بمراجعة قبل اعتمادها، وقد تُرفض إذا لم يكتمل الشراء أو تعذّر التحقق منه أو تم
          إرجاع الطلب. النقاط والجوائز ذات قيمة ترويجية داخل التطبيق فقط وغير قابلة للتحويل نقدًا ما لم يُذكر خلاف ذلك.
        </p>
      </LegalSection>

      <LegalSection title="٥) المساعد الذكي">
        <p>
          ردود المساعد «حكيم» والقائمة الذكية تُولَّد آليًا وقد تحتوي على أخطاء، فهي للاسترشاد فقط ولا تُعد نصيحة
          مالية أو قانونية. تحقّق دائمًا من التفاصيل لدى المتجر قبل الشراء.
        </p>
      </LegalSection>

      <LegalSection title="٦) الاستخدام المقبول">
        <ul className="list-disc pr-5 space-y-1">
          <li>عدم محاولة اختراق الخدمة أو تعطيلها أو الوصول لبيانات مستخدمين آخرين.</li>
          <li>عدم سحب البيانات آليًا أو إعادة نشرها تجاريًا دون إذن مكتوب.</li>
          <li>عدم إنشاء حسابات وهمية أو التلاعب بنظام النقاط والكاش باك.</li>
        </ul>
      </LegalSection>

      <LegalSection title="٧) حدود المسؤولية">
        <p>
          تُقدَّم الخدمة «كما هي». لا نتحمل مسؤولية الأضرار الناتجة عن تغيّر أسعار المتاجر أو انقطاع الخدمة أو
          قرارات شراء اتخذتها اعتمادًا على المعلومات المعروضة.
        </p>
      </LegalSection>

      <LegalSection title="٨) الإنهاء والتواصل">
        <p>
          يمكنك إنهاء استخدامك في أي وقت وطلب حذف حسابك من صفحة «حذف الحساب». لأي استفسار حول هذه الشروط
          راسلنا على {SUPPORT_EMAIL}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
