import { createFileRoute } from "@tanstack/react-router";
import { MessageCircleQuestion } from "lucide-react";
import { LegalPage, SUPPORT_EMAIL } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "الأسئلة الشائعة — HkeeemAI" },
      {
        name: "description",
        content:
          "هل حكيم مجاني؟ هل نبيع منتجات؟ كيف نضمن دقة الأسعار وهل تُحدَّث لحظيًا؟ إجابات مباشرة عن أشهر أسئلتكم.",
      },
      { property: "og:title", content: "الأسئلة الشائعة — HkeeemAI" },
      {
        property: "og:description",
        content: "إجابات مباشرة عن الأسئلة الأكثر شيوعًا حول حكيم AI والعروض والأسعار.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaqPage,
});

const FAQ_ITEMS = [
  {
    q: "هل الموقع مجاني؟",
    a: "نعم، حكيم مجاني 100%. يمكنك البحث والمقارنة واستخدام الكوبونات وقوائمك الذكية دون أي رسوم أو اشتراك. نحصل على عمولة إحالة من المتاجر عندما تشتري عبرنا — دون أي تكلفة إضافية عليك.",
  },
  {
    q: "هل تبيعون منتجات؟",
    a: "لا. حكيم ليس متجرًا ولا يبيع أي منتج. نجمع عروض المملكة من الأسواق والتطبيقات في مكان واحد ونحوّلك مباشرة إلى المتجر الأرخص لإتمام الشراء، فتدفع للمتجر نفسه بنفس سعره.",
  },
  {
    q: "كيف تضمنون دقة الأسعار؟",
    a: "نجمع الأسعار من مصادر المتاجر الرسمية وعروضها المعلنة، ونعرض السعر قبل وبعد الخصم بوضوح. نعمل باستمرار على التحقق من العروض وإزالة المنتهي منها، وإذا لاحظت فرقًا في السعر يمكنك الإبلاغ عنه من صفحة العرض وسنتابعه فورًا.",
  },
  {
    q: "هل تُحدَّث الأسعار لحظيًا؟",
    a: "نحدّث الأسعار والعروض بشكل دوري متقارب من اللحظي، وأسعار بعض المتاجر تظهر مباشرة عند فتح العرض. لمتابعة منتج معين، فعّل تنبيه انخفاض السعر وسنُشعرك فور وصوله للسعر الذي تريده.",
  },
] as const;

function FaqPage() {
  return (
    <LegalPage
      icon={MessageCircleQuestion}
      title="الأسئلة الشائعة"
      updated="سبتمبر 2026"
      intro={`إجابات سريعة عن الأسئلة الأكثر شيوعًا. ما لقيت جوابك؟ راسلنا على ${SUPPORT_EMAIL}.`}
    >
      <div className="bg-card rounded-2xl border border-border/60 shadow-card px-2 py-1">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-right text-sm font-bold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5 space-y-2">
        <h2 className="font-black text-base">سؤال آخر؟</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          فريقنا يرد على{" "}
          <a className="text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>{" "}
          وعبر واتساب من روابط الفوتر أسفل الصفحة.
        </p>
      </div>
    </LegalPage>
  );
}
