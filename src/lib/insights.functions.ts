import { createServerFn } from "@tanstack/react-start";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createLovableAiGateway } from "@/lib/ai-gateway.server";

const AnalysisInput = z.object({
  store: z.string().min(1).max(600),
  competitors: z.string().max(1000),
  notes: z.string().max(2000),
});

const AnalysisSchema = z.object({
  positioning: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
  growth: z.array(z.string()),
  shipping: z.array(z.string()),
});

export type StoreAnalysis = z.infer<typeof AnalysisSchema>;

export const analyzeStore = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalysisInput.parse(input))
  .handler(async ({ data }): Promise<StoreAnalysis> => {
    const gateway = createLovableAiGateway();

    const prompt = `حلّل المتجر السعودي التالي تحليلاً تجارياً عملياً باللغة العربية الفصحى المعاصرة:
- المتجر: ${data.store}
- المنافسون: ${data.competitors || "غير محدد (استنتج أبرز المنافسين في السوق السعودي)"}
- ملاحظات إضافية: ${data.notes || "لا يوجد"}

المطلوب:
- positioning: فقرة قصيرة (سطران كحد أقصى) عن تموضع الأسعار مقارنة بالسوق السعودي.
- strengths / weaknesses / opportunities / threats: من 3 إلى 4 نقاط لكل عنصر، كل نقطة جملة قصيرة.
- growth: 3 استراتيجيات نمو عملية.
- shipping: 3 طرق لتخفيض تكلفة الشحن في السعودية (سبل، سمسا، التجميع، حدود الشحن المجاني).
لا تستخدم رموزاً تعبيرية، واذكر الأسعار بالريال السعودي شاملة الضريبة عند اللزوم. اكتب كل النصوص بالعربية الفصحى المعاصرة فقط، دون عامية.`;

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        output: Output.object({ schema: AnalysisSchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("تعذّر توليد التحليل، حاول مرة أخرى.");
      }
      throw error;
    }
  });
