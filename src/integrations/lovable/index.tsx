import { supabase } from "@/integrations/supabase/client";

type OAuthProvider = "google" | "apple" | "azure";

type OAuthResult = { error: Error | null; redirected: boolean };

export const lovable = {
  init: () => {},
  auth: {
    async signInWithOAuth(
      provider: OAuthProvider,
      options?: { redirect_uri?: string },
    ): Promise<OAuthResult> {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: options?.redirect_uri ?? window.location.origin },
      });
      return { error: error ? new Error(error.message) : null, redirected: !error };
    },
  },
};

export function LovableIntegrationView() {
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <header className="p-4 border-b border-border/40">
        <h1 className="text-lg font-bold">لوحة تكاملات Lovable</h1>
      </header>
      <main className="flex-1 p-6">
        <p className="text-muted-foreground text-sm">التكاملات والأدوات تعمل بكفاءة عالية ضمن بيئة المنصة.</p>
      </main>
    </div>
  );
}

export default LovableIntegrationView;
