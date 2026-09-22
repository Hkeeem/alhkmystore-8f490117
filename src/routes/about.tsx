import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { LegalPage, LegalSection, SUPPORT_EMAIL } from "@/components/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — HkeeemAI" },
      {
        name: "description",
        content:
          "قصة حكيم AI ورسالته: مصلحة المشتري أولًا. نحصل على عمولة إحالة من المتاجر دون أي تكلفة عليك.",
      },
      { property: "og:title", content: "من نحن — HkeeemAI" },
      {
        property: "og:description",
        content:
          "قصة الفكرة، رسالتنا، وكيف نربح بشفافية: حكيم مجاني 100% للمشتري.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <LegalPage
      icon={Sparkles}
      title="من نحن"
      updated="سبتمبر 2026"
      intro="حكيم AI منصة سعودية تجمع عروض المملكة من الأسواق والتطبيقات، تقارنها لحظيًا، وتأخذك للعرض الأفضل — مجانًا وبشفافية كاملة."
    >
      <LegalSection title="قصة الفكرة">
        <p>
          بدأت الفكرة من موقف يومي بسيط: نفس المنتج يُباع بأسعار مختلفة في عدة متاجر، والمشتري ما
          عنده وقت يدور بين التطبيقات والمواقع كل مرة. قررنا نبني «حكيم» — مساعد ذكي يفعل هذا
          الدور عنك: يجمع كل العروض والكوبونات في مكان واحد، يقارن الأسعار بين المتاجر لحظيًا،
          ويرشّح لك العرض الأفضل بذكاء اصطناعي يفهم السوق السعودي.
        </p>
      </LegalSection>

      <LegalSection title="رسالتنا: مصلحة المشتري أولًا">
        <p>
          رسالتنا واضحة: أن تشتري ما تريد بأرخص سعر ممكن، دون عناء البحث. نحن لسنا متجرًا ولا
          نبيع منتجات — نحن في صفّك أنت: نرتب النتائج حسب التوفير الحقيقي لا حسب الجهة التي
          تدفع أكثر، ونوضح لك السعر قبل وبعد الخصم، ونُبقي الترتيب مبنياً على مصلحتك.
        </p>
      </LegalSection>

      <LegalSection title="كيف نربح بشفافية">
        <p>
          حكيم <strong>مجاني 100% للمشتري</strong>. مصدر دخلنا الوحيد هو عمولة إحالة بسيطة من
          المتاجر: عندما تختار عرضًا وتنتقل للمتجر وتشتري، يحصل المتجر على بيعه ونتقنّى نحن
          عمولة صغيرة من المتجر دون أي تكلفة إضافية عليك — السعر الذي تدفعه هو نفسه الذي
          تدفعه للمتجر مباشرة. لا نفرض رسوم اشتراك على التصفح والمقارنة، ولا نبيع بياناتك
          الشخصية لأي طرف.
        </p>
      </LegalSection>

      <LegalSection title="بيانات التواصل">
        <ul className="list-disc pr-5 space-y-1">
          <li>
            البريد الإلكتروني:{" "}
            <a className="text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </li>
          <li>
            واتساب:{" "}
            <a
              className="text-primary underline"
              href="https://wa.me/966500000000"
              target="_blank"
              rel="noopener noreferrer"
            >
              تواصل مباشر
            </a>
          </li>
          <li>
            حساباتنا: X وإنستغرام وتيك توك وسناب — روابطها أسفل كل صفحة في الموقع.
          </li>
        </ul>
        <p>نرحّب بملاحظاتك واقتراحاتك — تطوّر حكيم يبدأ من تجربتك.</p>
      </LegalSection>
    </LegalPage>
  );
}
