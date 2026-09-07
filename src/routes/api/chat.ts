import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGateway } from "@/lib/ai-gateway.server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { deals, stores } from "@/data/deals";

type CatalogLine = string;

async function loadLiveCatalog(): Promise<{ deals: CatalogLine[]; coupons: CatalogLine[] }> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nowIso = new Date().toISOString();
    const [merchantRes, externalRes, couponRes] = await Promise.all([
      supabaseAdmin
        .from("merchant_deals")
        .select("id,title,unit,price,original_price,expires_at,coupon_code,product_url,merchants!inner(name)")
        .eq("status", "published")
        .order("discount_percent", { ascending: false })
        .limit(60),
      supabaseAdmin
        .from("external_deals")
        .select("id,title,unit,price,original_price,store_name,store_id,expires_at,product_url")
        .eq("active", true)
        .order("discount_percent", { ascending: false })
        .limit(60),
      supabaseAdmin
        .from("coupons")
        .select("code,store_name,title,discount,expires_at")
        .eq("active", true)
        .limit(30),
    ]);

    const dealLines: CatalogLine[] = [];
    for (const row of merchantRes.data ?? []) {
      const isExpired = row.expires_at ? row.expires_at < nowIso : false;
      const merchant = (row as { merchants?: { name?: string } }).merchants;
      dealLines.push(
        `- [id:${row.id}] ${row.title}${row.unit ? ` (${row.unit})` : ""} | متجر: ${merchant?.name ?? "تاجر موثّق"} | سعر: ${row.price} ر.س | قبل: ${row.original_price} ر.س${row.coupon_code ? ` | كود: ${row.coupon_code}` : ""}${isExpired ? " | ملاحظة: انتهت صلاحية العرض" : ""}`,
      );
    }
    for (const row of externalRes.data ?? []) {
      dealLines.push(
        `- [id:${row.id}] ${row.title}${row.unit ? ` (${row.unit})` : ""} | متجر: ${row.store_name ?? row.store_id} | سعر: ${row.price} ر.س | قبل: ${row.original_price} ر.س`,
      );
    }

    const couponLines = (couponRes.data ?? []).map(
      (c) => `- ${c.store_name}: كود ${c.code} — ${c.title}${c.discount ? ` (${c.discount})` : ""}`,
    );

    return { deals: dealLines, coupons: couponLines };
  } catch {
    return { deals: [], coupons: [] };
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("bad request", { status: 400 });
        if (messages.length > 40) return new Response("too many messages", { status: 400 });
        const totalChars = JSON.stringify(messages).length;
        if (totalChars > 24000) return new Response("conversation too long", { status: 400 });

        const live = await loadLiveCatalog();

        const staticLines = deals.map((d) => {
          const s = stores.find((x) => x.id === d.storeId);
          return `- [id:${d.id}] ${d.title}${d.unit ? ` (${d.unit})` : ""} | متجر: ${s?.name ?? "متجر"} | سعر: ${d.price} ر.س | قبل: ${d.originalPrice} ر.س | تنتهي: ${d.expiresIn}`;
        });

        const allLines = [...live.deals, ...staticLines];
        const catalog = allLines.length ? allLines.join("\n") : "(لا توجد عروض محدّثة في القاعدة الآن)";
        const couponsBlock = live.coupons.length
          ? live.coupons.join("\n")
          : "(لا توجد أكواد خصم مفعّلة الآن)";

        const system = `أنت "حكيم"، مساعد سعودي ذكي وودود متخصص في عروض المملكة. تكلّم بلهجة سعودية طبيعية ومختصرة (سطرين إلى ثلاثة كحد أقصى) لأن ردودك ممكن تُقرأ بصوت عالٍ. عرّف نفسك كـ"حكيم" لما يسألك المستخدم عن اسمك.

قاعدة العروض المتاحة اليوم:
${catalog}

أكواد الخصم المفعّلة:
${couponsBlock}



قواعد:
- استخدم فقط العروض أعلاه، لا تخترع أسعار أو متاجر.
- عند المقارنة، رتّب الأرخص أوّلاً واذكر نسبة التوفير.
- تجنّب الرموز التعبيرية والرموز الخاصة قدر الإمكان (الردود قد تُنطق صوتياً).
- إذا ما لقيت المنتج بالضبط في القاعدة: لا توقف الرد عند "لا يوجد". قل "ما فيه عرض مؤكد لهذا المنتج الحين"، ثم لازم تعطي بديلاً مفيداً: أقرب منتج مشابه من القاعدة، أو كود خصم مفعّل من قائمة الأكواد أعلاه يفيده في نفس المتجر، أو اقترح عليه يتابع صفحة العروض أو يفعّل تنبيه انخفاض السعر لهذا المنتج.
- إذا كانت القاعدة فاضية تماماً، وضّح أن العروض تُحدَّث أول بأول، واقترح كود خصم مفعّل أو تنبيه سعر، ولا تخترع أي سعر.
- إذا كان العرض مكتوب عنده "انتهت صلاحية العرض"، نبّه المستخدم أنه قد يكون منتهياً قبل ما توصي فيه.
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
