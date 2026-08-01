import { useState } from "react";
import type { Store } from "@/data/deals";
import { getStoreIcon } from "@/lib/icons";

interface StoreLogoProps {
  store: Store;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-6 h-6 rounded-lg", img: "w-6 h-6", icon: "w-3.5 h-3.5", text: "text-xs" },
  md: { container: "w-10 h-10 rounded-xl", img: "w-10 h-10", icon: "w-5 h-5", text: "text-sm" },
  lg: { container: "w-14 h-14 rounded-2xl", img: "w-14 h-14", icon: "w-7 h-7", text: "text-xl" },
};

export function StoreLogo({ store, size = "md", className = "" }: StoreLogoProps) {
  const [imgError, setImgError] = useState(false);
  const StoreIcon = getStoreIcon(store);
  const s = sizeMap[size];

  const hasLogo = store.logoUrl && !imgError;

  return (
    <div
      className={`${s.container} flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{ background: hasLogo ? "white" : store.color }}
    >
      {hasLogo ? (
        <img
          src={store.logoUrl}
          alt={store.name}
          onError={() => setImgError(true)}
          loading="lazy"
          decoding="async"
          className={`${s.img} object-contain p-1`}
        />
      ) : (
        <StoreIcon className={`${s.icon} text-white`} strokeWidth={2.4} />
      )}
    </div>
  );
}
