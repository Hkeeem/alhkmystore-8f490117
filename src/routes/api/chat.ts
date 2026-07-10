import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGateway } from "@/lib/ai-gateway.server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { deals, stores } from "@/data/deals";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("bad request", { status: 400 });

        const catalog = deals.map((d) => {
          const s = stores.find(x => x.id === d.storeId)!;
          return `[${d.id}] ${d.title}${d.unit ? ` (${d.unit})` : ""} | متجر: ${s.name} | سعر: ${d.price} ر.س | قبل: ${d.originalPrice} ر.س | تنتهي: ${d.expiresIn}`;
        }).join("\n");

        const system = `أنت "مكّي"، مساعد سعودي ذكي وودود متخصص في عروض المملكة. تكلّم بلهجة سعودية طبيعية ومختصرة (سطرين إلى ثلاثة كحد أقصى) لأن ردودك ممكن تُقرأ بصوت عالٍ. عرّف نفسك كـ"مكّي" لما يسألك المستخدم عن اسمك.

قاعدة العروض المتاحة اليوم (كل عرض له معرّف بين أقواس مربعة):
${catalog}

قواعد صارمة:
- استخدم فقط العروض أعلاه، لا تخترع أسعار أو متاجر.
- عند المقارنة، رتّب الأرخص أوّلاً واذكر نسبة التوفير.
- تجنّب الرموز التعبيرية والرموز الخاصة قدر الإمكان (الردود قد تُنطق صوتياً).
- إذا ما لقيت المنتج في القاعدة، قل بصراحة "ما عندي عرض حالي على هذا".`;


        const gateway = createLovableAiGateway();
        const result = streamText({
          model: gateway("openai/gpt-5.5"),
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
