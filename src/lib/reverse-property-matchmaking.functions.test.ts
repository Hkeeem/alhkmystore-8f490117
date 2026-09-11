import { describe, expect, it } from "vitest";
import {
  buyerRequestInputSchema,
  propertyListingInputSchema,
} from "./reverse-property-matchmaking.functions";

const buyerRequest = {
  fullName: "مشتري اختبار",
  phone: "0551234567",
  purpose: "شراء" as const,
  city: "جدة",
  district: "الروضة",
  propertyType: "شقة",
  maxPrice: 900000,
  minBedrooms: 3,
  features: ["مصعد"],
  requiredServices: ["مدارس"],
  contactConsent: true as const,
};

describe("reverse property matchmaking input schemas", () => {
  it("accepts a complete buyer request with clear contact consent", () => {
    expect(buyerRequestInputSchema.parse(buyerRequest)).toMatchObject({
      city: "جدة",
      contactConsent: true,
      maxPrice: 900000,
    });
  });

  it("rejects missing consent and invalid mobile numbers before persistence", () => {
    expect(
      buyerRequestInputSchema.safeParse({ ...buyerRequest, contactConsent: false }).success,
    ).toBe(false);
    expect(buyerRequestInputSchema.safeParse({ ...buyerRequest, phone: "050" }).success).toBe(
      false,
    );
  });

  it("accepts a complete property listing and rejects unusable pricing", () => {
    const listing = {
      purpose: "شراء" as const,
      city: "جدة",
      district: "الروضة",
      propertyType: "شقة",
      price: 850000,
      bedrooms: 3,
      features: ["مصعد", "مطبخ راكب"],
      requiredServices: ["مدارس"],
    };
    expect(propertyListingInputSchema.parse(listing).price).toBe(850000);
    expect(propertyListingInputSchema.safeParse({ ...listing, price: 0 }).success).toBe(false);
  });
});
