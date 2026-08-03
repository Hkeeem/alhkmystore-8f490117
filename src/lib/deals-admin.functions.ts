import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertStaff,
  deleteExternalDealRow,
  importExternalDealRows,
  listExternalDealRows,
  runCrawl,
  setExternalDealActive,
  type ImportRow,
} from "@/lib/deals-admin.server";

const ImportSchema = z.object({
  rows: z
    .array(
      z.object({
        store_id: z.string().min(1),
        store_name: z.string().min(1),
        title: z.string().min(1),
        brand: z.string().optional(),
        category: z.string().min(1),
        unit: z.string().optional(),
        original_price: z.number().positive(),
        price: z.number().positive(),
        image_url: z.string().optional(),
        product_url: z.string().optional(),
        product_key: z.string().optional(),
        expires_at: z.string().nullable().optional(),
      }),
    )
    .min(1)
    .max(200),
});

export const listExternalDeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    return listExternalDealRows();
  });

export const importExternalDeals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => ImportSchema.parse(v))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    return importExternalDealRows(data.rows as ImportRow[], context.userId);
  });

export const toggleExternalDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(v))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    return setExternalDealActive(data.id, data.active);
  });

export const deleteExternalDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    return deleteExternalDealRow(data.id);
  });

export const crawlDealsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ sources: z.array(z.string()).optional() }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    return runCrawl(data.sources);
  });
