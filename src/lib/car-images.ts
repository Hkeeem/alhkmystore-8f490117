import sedan from "@/assets/cars/sedan.jpg";
import pickup from "@/assets/cars/pickup.jpg";
import crossover from "@/assets/cars/crossover.jpg";
import suv from "@/assets/cars/suv.jpg";

/** صورة السيارة: صورة المورد إن وُجدت، وإلا صورة توضيحية حسب نوع الهيكل */
export function carImage(car: { image_url: string | null; body_type: string }) {
  if (car.image_url) return { src: car.image_url, illustrative: false };
  const t = car.body_type;
  const src = t.includes("بيك") ? pickup : t.includes("كروس") ? crossover : t.includes("رباعي") ? suv : sedan;
  return { src, illustrative: true };
}

export const CAR_FILTERS_KEY = "hk-car-filters";
