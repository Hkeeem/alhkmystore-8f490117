import { useEffect } from "react";
import { installPreviewErrorCapture } from "@/lib/preview-errors";

/** يشغّل التقاط أخطاء المعاينة مرة واحدة على مستوى التطبيق */
export function PreviewErrorRecorder() {
  useEffect(() => {
    installPreviewErrorCapture();
  }, []);
  return null;
}
