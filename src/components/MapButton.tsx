import { MapPin } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function MapButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/maps" })}
      aria-label="عرض العروض على الخريطة"
      className="w-12 h-12 rounded-full bg-[#5B21B6] text-white shadow-[0_8px_20px_rgba(91,33,182,0.4)] flex items-center justify-center fixed bottom-6 left-6 z-50 hover:scale-105 transition-transform"
    >
      <span className="absolute inset-0 rounded-full bg-[#5B21B6]/30 animate-ping pointer-events-none" aria-hidden="true" />
      <MapPin className="w-5 h-5 relative" />
    </button>
  );
}

export default MapButton;
