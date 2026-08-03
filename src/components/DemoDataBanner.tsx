import { Info, X } from "lucide-react";
import { useState } from "react";

/**
 * تنبيه لطيف يوضح أن العروض المعروضة بيانات تجريبية للعرض فقط،
 * وأن العروض الحقيقية تأتي من التجّار الموثّقين.
 */
export function DemoDataBanner() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
      style={{
        borderColor: "color-mix(in oklab, #D4AF37 45%, transparent)",
        background: "color-mix(in oklab, #D4AF37 10%, transparent)",
      }}
    >
      <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#D4AF37" }} />
      <div className="flex-1 leading-relaxed">
        <p className="font-bold" style={{ color: "#D4AF37" }}>
          بيانات تجريبية للعرض
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">
          الأسعار والعروض هنا نماذج توضيحية لتجربة التطبيق. العروض الحقيقية تظهر ضمن
          قسم «عروض حقيقية من التجّار» بعد توثيق المتجر.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="إخفاء التنبيه"
        className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground transition press-ripple"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default DemoDataBanner;
