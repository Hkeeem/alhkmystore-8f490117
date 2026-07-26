import { createFileRoute, Link } from "@tanstack/react-router";
import { UserMinus, AlertTriangle, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SUPPORT_EMAIL } from "@/components/Footer";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "حذف الحساب — HkeeemAI" },
      { name: "description", content: "اطلب حذف حسابك وبياناتك في HkeeemAI: ما الذي يُحذف، وكم يستغرق الطلب، وكيف تتواصل معنا." },
      { property: "og:title", content: "حذف الحساب — HkeeemAI" },
      { property: "og:description", content: "خطوات طلب حذف الحساب والبيانات في تطبيق HkeeemAI." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const { user } = useAuth();
  const email = user?.email ?? "";
  const subject = encodeURIComponent("طلب حذف حساب — HkeeemAI");
  const body = encodeURIComponent(
    `مرحبًا فريق HkeeemAI،\n\nأرغب في حذف حسابي وجميع بياناتي المرتبطة به.\n\nالبريد المسجّل: ${email || "(اكتب بريدك هنا)"}\nسبب الحذف (اختياري): \n\nشكرًا.`,
  );

  return (
    <main className="max-w-3xl mx-auto px-4 pt-6 pb-12 space-y-6">
      <header className="flex min-w-0 items-center gap-3">
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-gold glow-gold flex items-center justify-center">
          <UserMinus className="w-6 h-6 text-secondary" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display font-black text-2xl md:text-3xl text-gold-shine">حذف الحساب</h1>
          <p className="text-xs text-muted-foreground">إزالة حسابك وبياناتك من HkeeemAI</p>
        </div>
      </header>

      <section className="bg-card rounded-2xl border border-border/60 shadow-card p-5 space-y-2">
        <h2 className="font-black text-base">ما الذي سيُحذف؟</h2>
        <ul className="list-disc pr-5 text-sm text-muted-foreground leading-relaxed space-y-1">
          <li>حساب الدخول وبيانات ملفك الشخصي.</li>
          <li>قائمة المفضلة وتنبيهات انخفاض السعر.</li>
          <li>نقاط الجوائز وسجل النشاط المحفوظ في حسابك.</li>
          <li>طلبات الكاش باك غير المكتملة.</li>
        </ul>
        <p className="text-xs text-muted-foreground pt-1">
          ملاحظة: قد نحتفظ بسجلات عمليات الكاش باك المدفوعة للأغراض المحاسبية فقط، دون استخدامها في التسويق.
        </p>
      </section>

      <section className="bg-card rounded-2xl border border-border/60 shadow-card p-5 space-y-3">
        <h2 className="font-black text-base">كيف تطلب الحذف؟</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          أرسل طلبك من بريدك المسجّل وسنؤكد الحذف بعد التحقق من هويتك. المدة المعتادة حتى ٣٠ يومًا كحد أقصى.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-gold text-secondary text-sm font-bold glow-gold press-ripple"
          >
            <Mail className="w-4 h-4" /> أرسل طلب الحذف
          </a>
          {user ? (
            <Link
              to="/me"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/60 text-sm font-bold hover:bg-secondary press-ripple transition"
            >
              راجع بياناتي أولًا
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/60 text-sm font-bold hover:bg-secondary press-ripple transition"
            >
              سجّل الدخول لتأكيد هويتك
            </Link>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
          الحذف نهائي ولا يمكن التراجع عنه. إن أردت إيقاف التنبيهات فقط، تقدر تعطّلها من صفحة «حسابي» بدون حذف الحساب.
        </p>
      </section>

      <section className="bg-card rounded-2xl border border-border/60 shadow-card p-5 space-y-2">
        <h2 className="font-black text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> روابط ذات صلة
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/privacy" className="text-sm text-primary underline">سياسة الخصوصية</Link>
          <Link to="/terms" className="text-sm text-primary underline">الشروط والأحكام</Link>
        </div>
      </section>
    </main>
  );
}
