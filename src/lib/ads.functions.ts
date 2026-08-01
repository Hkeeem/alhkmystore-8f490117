import { createServerFn } from "@tanstack/react-start";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createLovableAiGateway } from "@/lib/ai-gateway.server";

const AdsInput = z.object({
  product: z.string().min(1),
  audience: z.string(),
  platform: z.enum(["سناب شات", "تيك توك", "إنستغرام"]),
  dialect: z.enum(["سعودية", "فصحى"]),
  tone: z.string(),
});

const AdsSchema = z.object({
  headline: z.string(),
  metaDescription: z.string(),
  copies: z.array(z.object({ hook: z.string(), body: z.string(), cta: z.string() })),
  hashtags: z.array(z.string()),
  keywords: z.array(z.string()),
});

export type AdsResult = z.infer<typeof AdsSchema>;

export const generateAds = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AdsInput.parse(input))
  .handler(async ({ data }): Promise<AdsResult> => {
    const gateway = createLovableAiGateway();

    const prompt = `اكتب محتوى إعلانياً لمنصة ${data.platform} لسوق السعودية.
- المنتج/الخدمة: ${data.product}
- الجمهور: ${data.audience || "الجمهور السعودي العام"}
- اللغة: ${data.dialect === "سعودية" ? "لهجة سعودية طبيعية" : "عربية فصحى مبسطة"}
- النبرة: ${data.tone || "حماسية ومقنعة"}

المطلوب:
- headline: عنوان إعلاني قوي لا يتجاوز 60 حرفاً.
- metaDescription: وصف تسويقي لا يتجاوز 155 حرفاً مناسب لمحركات البحث.
- copies: 3 نسخ إعلانية، كل نسخة فيها hook (جملة افتتاحية قصيرة) و body (سطران كحد أقصى) و cta (دعوة لاتخاذ إجراء).
- hashtags: 6 هاشتاقات مناسبة للمنصة تبدأ بعلامة #.
- keywords: 6 كلمات مفتاحية SEO بالعربية.
الأسعار إن ذُكرت تكون بالريال السعودي شاملة ضريبة القيمة المضافة. تجنّب المبالغات غير الواقعية.`;

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        output: Output.object({ schema: AdsSchema }),
        prompt,
      });
      return {
        ...output,
        copies: output.copies.slice(0, 3),
        hashtags: output.hashtags.slice(0, 8),
        keywords: output.keywords.slice(0, 8),
      };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("تعذّر توليد المحتوى، حاول مرة أخرى.");
      }
      throw error;
    }
  });
