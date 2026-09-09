import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { createLovableAiGateway } from "@/lib/ai-gateway.server";
import { deals, stores } from "@/data/deals";

const Input = z.object({ text: z.string().min(1).max(4000) });

const Item = z.object({
  requested: z.string(),
  dealId: z.string().nullable(),
  note: z.string().nullable(),
});
const Schema = z.object({
  items: z.array(Item),
  strategy: z.string(),
});

export const buildSmartList = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => Input.parse(v))
  .handler(async ({ data }) => {
    const catalog = deals.map((d) => {
      const s = stores.find((x) => x.id === d.storeId)!;
      return `id=${d.id} | ${d.title}${d.unit ? ` (${d.unit})` : ""} | متجر: ${s.name} | سعر: ${d.price} ر.س`;
    }).join("\n");

    const prompt = `المستخدم كتب قائمة تسوّق (كل سطر أو فاصلة = منتج):
"""
${data.text}
"""

اختر من قاعدة العروض التالية الأنسب لكل منتج (الأرخص والأقرب للطلب). أعد JSON فيه:
- items: قائمة بكل منتج طلبه، مع dealId إذا وُجدت مطابقة، أو null.
- strategy: جملة عربية قصيرة بالفصحى تشرح مقدار التوفير المتوقع.

قاعدة العروض:
${catalog}

اكتب كل النصوص بالعربية الفصحى المعاصرة فقط.`;

    const gateway = createLovableAiGateway();

    try {
      const { output } = await generateText({
        model: gateway("openai/gpt-5-mini"),
        output: Output.object({ schema: Schema }),
        prompt,
      });
      const items = output.items.map((it) => ({
        requested: it.requested,
        deal: it.dealId ? deals.find((d) => d.id === it.dealId) ?? null : null,
        note: it.note,
      }));
      const total = items.reduce((s, it) => s + (it.deal?.price ?? 0), 0);
      const original = items.reduce((s, it) => s + (it.deal?.originalPrice ?? 0), 0);
      return { items, total, saved: original - total, strategy: output.strategy };
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) {
        return { items: [], total: 0, saved: 0, strategy: "تعذّر توليد القائمة، حاول مرة ثانية." };
      }
      throw e;
    }
  });
