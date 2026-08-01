import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDeployStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("./deploy.guard.server");
    await assertStaff(context.supabase, context.userId);
    const { fetchLastDeployment } = await import("./deploy.server");
    return fetchLastDeployment();
  });
