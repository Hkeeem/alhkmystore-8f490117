import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";

export function MapButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      // التأكد من تحميل الخريطة وتجنب التكرار عند فتح النافذة
      const timer = setTimeout(() => {
        const L = (window as any).L;
        if (L && !document.getElementById('map-instance-active')) {
          const mapCenter: [number, number] = [24.7136, 46.6753]; // إحداثيات الموقع (يمكنك تعديلها)
          const map = L.map('alhkmy-modal-map', { zoomControl: false }).setView(mapCenter, 15);

          // تصميم خريطة هادئ ونظيف (CartoDB Voyager)
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
          }).addTo(map);

          // علامة دائرية مخصصة مطابقة للهوية البصرية
          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div id="map-instance-active" style="background-color: #2563eb; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></div>`,
            iconSize: [24, 24],
          });

          L.marker(mapCenter, { icon: customIcon }).addTo(map)
            .bindPopup("<div dir='rtl' style='font-family: sans-serif;'><b>alhkmy.app</b><br>موقع العروض والخدمات</div>");
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [open]);

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
            className="bg-white w-full md:max-w-xl rounded-t-3xl md:rounded-3xl p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-zinc-900">العروض على الخريطة</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-700" />
              </button>
            </div>

            {/* استدعاء ملفات الـ CSS الخاصة بالخريطة */}
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

            {/* حاوية الخريطة التفاعلية */}
            <div 
              id="alhkmy-modal-map" 
              className="w-full h-80 rounded-2xl border border-zinc-200 overflow-hidden"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default MapButton;
