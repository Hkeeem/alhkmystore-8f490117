import { useState } from "react";
import { MapPin, X } from "lucide-react";

export function MapButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="عرض العروض على الخريطة"
        className="w-12 h-12 rounded-full bg-[#5B21B6] text-white shadow-[0_8px_20px_rgba(91,33,182,0.4)] flex items-center justify-center fixed bottom-6 left-6 z-50"
      >
        <span className="absolute inset-0 rounded-full bg-[#5B21B6]/30 animate-ping" aria-hidden />
        <MapPin className="w-5 h-5 relative" />
      </button>

      {open && (
        <div
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-label="خريطة العروض"
          className="fixed inset-0 z-[60] bg-black/50 flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-zinc-900">العروض على الخريطة</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-zinc-700" />
              </button>
            </div>
            <div className="h-56 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 text-sm font-bold">
              الخريطة قريباً
            </div>
          </div>
        </div>
      )}
    </>
  );
}
