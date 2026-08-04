import { Info, RefreshCw, X } from "lucide-react";
import { useState } from "react";

type DemoDataBannerProps = {
  /** true = تضمين البيانات التجريبية، false = عرض البيانات الحقيقية فقط */
  showDemoData: boolean;
  onShowDemoDataChange: (showDemoData: boolean) => void;
  /** يعيد جلب العروض والفروع وتحديث الخريطة */
  onRefresh: () => Promise<void> | void;
};

/**
 * شريط للتحكم بعرض البيانات التجريبية وتحديث بيانات العروض.
 */
export function DemoDataBanner({
  showDemoData,
  onShowDemoDataChange,
  onRefresh,
}: DemoDataBannerProps) {
  const [hidden, setHidden] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (hidden) return null;

  const handleRefresh = async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
      style={{
        borderColor: "color-mix(in oklab, #D4AF37 45%, transparent)",
        background: "color-mix(in oklab, #D4AF37 10%, transparent)",
      }}
    >
      <Info
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: "#D4AF37" }}
      />

      <div className="min-w-0 flex-1 leading-relaxed">
        <p className="font-bold" style={{ color: "#D4AF37" }}>
          {showDemoData ? "بيانات تجريبية للعرض" : "العروض الحقيقية فقط"}
        </p>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {showDemoData
            ? "الأسعار والعروض التجريبية ظاهرة الآن مع العروض الحقيقية."
            : "يتم الآن إخفاء البيانات التجريبية وإظهار العروض القادمة من التجّار الموثّقين فقط."}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
            <button
              type="button"
              role="switch"
              aria-checked={showDemoData}
              aria-label="عرض البيانات التجريبية"
              onClick={() => onShowDemoDataChange(!showDemoData)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                showDemoData ? "bg-[#D4AF37]" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  showDemoData
                    ? "translate-x-1 rtl:-translate-x-1"
                    : "translate-x-6 rtl:-translate-x-6"
                }`}
              />
            </button>

            <span>عرض البيانات التجريبية</span>
          </label>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/50 px-3 py-1.5 text-xs font-semibold text-[#B8911D] transition hover:bg-[#D4AF37]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "جارٍ التحديث..." : "تحديث العروض"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="إخفاء التنبيه"
        className="shrink-0 rounded-full p-1 text-muted-foreground transition hover:text-foreground press-ripple"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default DemoDataBanner;
