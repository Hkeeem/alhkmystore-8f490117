import { describe, it, expect } from "vitest";
import {
  guardInspect,
  guardScan,
  hunt,
  buildPublishPost,
  discountOf,
  type AgentDeal,
} from "@/lib/agents";

const NOW = Date.parse("2026-01-10T00:00:00Z");

function deal(over: Partial<AgentDeal> = {}): AgentDeal {
  return {
    id: "d1",
    title: "سماعة لاسلكية",
    price: 100,
    original_price: 200,
    product_url: "https://store.example.com/p/1",
    expires_at: "2026-01-12T00:00:00Z",
    clicks: 10,
    storeName: "متجر موثوق",
    ...over,
  };
}

describe("وكلاء حكيم", () => {
  it("الحارس يمرر العرض السليم", () => {
    expect(guardInspect(deal(), NOW).safe).toBe(true);
  });

  it("الحارس يحجب المنتهي والرابط غير الآمن والسعر الخاطئ", () => {
    expect(guardInspect(deal({ expires_at: "2026-01-01T00:00:00Z" }), NOW).issues).toContain("expired");
    expect(guardInspect(deal({ product_url: "http://x.com" }), NOW).issues).toContain("insecure-url");
    expect(guardInspect(deal({ product_url: "" }), NOW).issues).toContain("no-url");
    expect(guardInspect(deal({ price: 300 }), NOW).issues).toContain("bad-price");
    expect(guardInspect(deal({ price: 1, original_price: 100 }), NOW).issues).toContain(
      "unrealistic-discount",
    );
  });

  it("الفحص الجماعي يفصل الآمن عن المحجوب", () => {
    const res = guardScan([deal(), deal({ id: "d2", product_url: null })], NOW);
    expect(res.safe).toHaveLength(1);
    expect(res.blocked).toHaveLength(1);
  });

  it("الصياد يرفع العرض الأقوى والأقرب انتهاءً", () => {
    const weak = deal({ id: "weak", price: 190, original_price: 200, expires_at: null, clicks: 0 });
    const strong = deal({ id: "strong", price: 60, original_price: 200, expires_at: "2026-01-10T10:00:00Z", clicks: 50 });
    const out = hunt([weak, strong], 2, NOW);
    expect(out[0].deal.id).toBe("strong");
    expect(out[0].reason).toBe("ينتهي خلال ٢٤ ساعة");
  });

  it("الناشر يبني نصاً عربياً يتضمن السعر والتوفير والرابط", () => {
    const text = buildPublishPost(deal(), "whatsapp", "https://alhkmy.store/deals/d1", NOW);
    expect(discountOf(deal())).toBe(50);
    expect(text).toContain("خصم 50٪");
    expect(text).toContain("توفير 100 ر.س");
    expect(text).toContain("https://alhkmy.store/deals/d1");
  });
});
