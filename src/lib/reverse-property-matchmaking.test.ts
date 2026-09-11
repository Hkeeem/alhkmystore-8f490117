import { describe, expect, it } from "vitest";
import { getSaudiCities, getSaudiDistricts, SAUDI_REGIONS } from "@/data/saudi-locations";
import {
  type BuyerMatch,
  createWhatsAppMatchLink,
  normalizeSaudiPhone,
  scoreTone,
  toggleSelection,
} from "./reverse-property-matchmaking";

const property = {
  city: "جدة",
  district: "الروضة",
  propertyType: "شقة",
  price: 850000,
  bedrooms: 3,
};

function buyer(overrides: Partial<BuyerMatch> = {}): BuyerMatch {
  return {
    id: "buyer-1",
    full_name: "باحث حقيقي",
    phone: "0551234567",
    city: "جدة",
    district: "الروضة",
    property_type: "شقة",
    purpose: "شراء",
    max_price: 900000,
    min_bedrooms: 3,
    features: ["مصعد"],
    required_services: ["مدارس"],
    match_score: 92,
    is_demo: false,
    created_at: "2026-08-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("reverse property matchmaking helpers", () => {
  it("normalizes common Saudi mobile formats", () => {
    expect(normalizeSaudiPhone("0551234567")).toBe("966551234567");
    expect(normalizeSaudiPhone("+966551234567")).toBe("966551234567");
    expect(normalizeSaudiPhone("551234567")).toBeNull();
  });

  it("creates a WhatsApp link only for a real buyer request", () => {
    const link = createWhatsAppMatchLink(buyer(), property);
    expect(link).toContain("https://wa.me/966551234567");
    expect(link).toContain(encodeURIComponent("نسبة 92%"));
    expect(createWhatsAppMatchLink(buyer({ is_demo: true }), property)).toBeNull();
    expect(createWhatsAppMatchLink(buyer({ phone: null }), property)).toBeNull();
  });

  it("toggles requested features without duplicates", () => {
    expect(toggleSelection([], "مصعد")).toEqual(["مصعد"]);
    expect(toggleSelection(["مصعد"], "مصعد")).toEqual([]);
    expect(scoreTone(90)).toBe("success");
    expect(scoreTone(70)).toBe("warning");
    expect(scoreTone(50)).toBe("neutral");
  });
});

describe("Saudi locations index", () => {
  it("provides the kingdom regions, cities, and dependent districts", () => {
    expect(SAUDI_REGIONS).toHaveLength(13);
    expect(SAUDI_REGIONS).toContain("منطقة الرياض");

    const riyadhCities = getSaudiCities("منطقة الرياض");
    expect(riyadhCities.length).toBeGreaterThan(0);
    expect(getSaudiDistricts("منطقة الرياض", riyadhCities[0] ?? "").length).toBeGreaterThan(0);
    expect(getSaudiDistricts("", "الرياض")).toEqual([]);

    const districtCount = SAUDI_REGIONS.flatMap((region) =>
      getSaudiCities(region).flatMap((city) => getSaudiDistricts(region, city)),
    ).length;
    expect(districtCount).toBeGreaterThanOrEqual(3700);
  });
});
