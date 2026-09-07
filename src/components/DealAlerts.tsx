import { useDealAlerts } from "@/hooks/use-deal-alerts";

/** يشغّل إشعارات آخر يوم للعرض والكوبونات الجديدة داخل التطبيق */
export function DealAlerts() {
  useDealAlerts();
  return null;
}
