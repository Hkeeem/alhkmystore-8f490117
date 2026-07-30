import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGateway } from "@/lib/ai-gateway.server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { deals, stores } from "@/data/deals";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth check
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("bad request", { status: 400 });

        const catalog = deals.map((d) => {
          const s = stores.find(x => x.id === d.storeId)!;
          return `- [id:${d.id}] ${d.title}${d.unit ? ` (${d.unit})` : ""} | متجر: ${s.name} | سعر: ${d.price} ر.س | قبل: ${d.originalPrice} ر.س | تنتهي: ${d.expiresIn}`;
        }).join("\n");

        const system = `أنت "حكيم"، مساعد سعودي ذكي وودود متخصص في عروض المملكة. تكلّم بلهجة سعودية طبيعية ومختصرة (سطرين إلى ثلاثة كحد أقصى) لأن ردودك ممكن تُقرأ بصوت عالٍ. عرّف نفسك كـ"حكيم" لما يسألك المستخدم عن اسمك.

قاعدة العروض المتاحة اليوم:
${catalog}

قواعد:
- استخدم فقط العروض أعلاه، لا تخترع أسعار أو متاجر.
- عند المقارنة، رتّب الأرخص أوّلاً واذكر نسبة التوفير.
- تجنّب الرموز التعبيرية والرموز الخاصة قدر الإمكان (الردود قد تُنطق صوتياً).
- إذا ما لقيت المنتج في القاعدة، قل بصراحة "لا يوجد حالياً" (لا تقل "ما عندي" أبداً)، ثم اقترح بديلاً قريباً إن وُجد.
- مهم جداً: كلما ذكرت عرضاً محدداً، ألصق بعده مباشرة الرمز {{deal:المعرّف}} حيث المعرّف هو قيمة id من القاعدة أعلاه، بدون فراغ. مثال: "أرز بسمتي من العثيم بـ 39 ر.س {{deal:othaim-basmati}}". لا تعرض المعرّف بأي شكل آخر ولا تنطقه.`;


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
