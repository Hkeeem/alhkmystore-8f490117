import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const purposeSchema = z.enum(["شراء", "إيجار"]);
const requestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^(?:\+?966|0)5\d{8}$/, "رقم الجوال غير صالح."),
  purpose: purposeSchema,
  city: z.string().trim().min(2).max(120),
  district: z.string().trim().min(2).max(160),
  propertyType: z.string().trim().min(2).max(80),
  maxPrice: z.number().finite().positive().max(100_000_000),
  minBedrooms: z.number().int().min(0).max(20),
  features: z.array(z.string().trim().min(1).max(80)).max(30),
  requiredServices: z.array(z.string().trim().min(1).max(80)).max(30),
  contactConsent: z.literal(true),
});

const propertySchema = z.object({
  purpose: purposeSchema,
  city: z.string().trim().min(2).max(120),
  district: z.string().trim().min(2).max(160),
  propertyType: z.string().trim().min(2).max(80),
  price: z.number().finite().positive().max(100_000_000),
  bedrooms: z.number().int().min(0).max(20),
  features: z.array(z.string().trim().min(1).max(80)).max(30),
  requiredServices: z.array(z.string().trim().min(1).max(80)).max(30),
});

export const submitBuyerRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => requestSchema.parse(data))
  .handler(async ({ context, data }) => {
    const db = context.supabase as any;
    const { data: saved, error } = await db
      .from("buyer_requests")
      .insert({
        user_id: context.userId,
        full_name: data.fullName,
        phone: data.phone,
        purpose: data.purpose,
        city: data.city,
        district: data.district,
        property_type: data.propertyType,
        max_price: data.maxPrice,
        min_bedrooms: data.minBedrooms,
        features: data.features,
        required_services: data.requiredServices,
        contact_consent: data.contactConsent,
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const matchBuyersForProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => propertySchema.parse(data))
  .handler(async ({ context, data }) => {
    const db = context.supabase as any;
    const { data: matches, error } = await db.rpc("match_buyers_for_property", {
      p_city: data.city,
      p_district: data.district,
      p_property_type: data.propertyType,
      p_price: data.price,
      p_bedrooms: data.bedrooms,
      p_features: data.features,
      p_required_services: data.requiredServices,
      p_purpose: data.purpose,
    });
    if (error) throw new Error(error.message);
    return matches ?? [];
  });
