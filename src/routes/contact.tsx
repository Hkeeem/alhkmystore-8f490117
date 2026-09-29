import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone, Clock } from "lucide-react";
import { CONTACT } from "@/data/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — حكيم" },
      {
        name: "description",
        content: "تواصل مع فريق حكيم عبر البريد الإلكتروني أو واتساب أو الهاتف لأي استفسار عن العروض والكوبونات.",
      },
      { property: "og:title", content: "تواصل معنا — حكيم" },
      {
        property: "og:description",
        content: "راسلنا عبر البريد أو واتساب أو الهاتف وسنعود إليك في أقرب وقت.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alhkmystore.lovable.app/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://alhkmystore.lovable.app/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const waDigits = CONTACT.whatsapp.replace(/\D/g, "");
  const hasWhatsapp = waDigits.length >= 10;
  const hasPhone = CONTACT.phone.replace(/\D/g, "").length >= 9;

  return (
    <main className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5" dir="rtl">
      <header className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/25 via-card to-card p-5 text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-gold glow-gold flex items-center justify-center">
          <MessageCircle className="w-7 h-7 text-secondary" />
        </div>
        <h1 className="font-display font-black text-2xl md:text-3xl">تواصل معنا</h1>
        <p className="text-sm text-muted-foreground">
          أي استفسار عن العروض أو الكوبونات أو حسابك — فريق حكيم جاهز لمساعدتك.
        </p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-4 space-y-3">
        <a
          href={`mailto:${CONTACT.email}?subject=${encodeURIComponent("استفسار من تطبيق حكيم")}`}
          className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 hover:border-primary transition"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Mail className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-bold">البريد الإلكتروني</span>
            <span className="block text-sm text-muted-foreground truncate" dir="ltr">
              {CONTACT.email}
            </span>
          </span>
        </a>

        {hasWhatsapp && (
          <a
            href={`https://wa.me/${waDigits}?text=${encodeURIComponent("مرحبًا، لدي استفسار عن تطبيق حكيم")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 hover:border-primary transition"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C4B] shrink-0">
              <MessageCircle className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-bold">واتساب</span>
              <span className="block text-sm text-muted-foreground" dir="ltr">
                +{waDigits}
              </span>
            </span>
          </a>
        )}

        {hasPhone && (
          <a
            href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 hover:border-primary transition"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Phone className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-bold">الهاتف</span>
              <span className="block text-sm text-muted-foreground" dir="ltr">
                {CONTACT.phone}
              </span>
            </span>
          </a>
        )}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-4 flex items-start gap-3 text-sm text-muted-foreground">
        <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          نرد على الرسائل خلال مدة معقولة في أيام العمل. للابلاغ عن عرض منتهي أو رابط لا يعمل، أرسل لنا
          اسم العرض ورابطه وسنعالجه سريعًا.
        </p>
      </section>
    </main>
  );
}
