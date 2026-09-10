// سجل محلي لأخطاء المعاينة/البناء التي تظهر للمستخدم أثناء التصفح.
// يُحفظ في المتصفح فقط (localStorage) ويُعرض في صفحة /build-errors المحمية.

export type PreviewErrorEntry = {
  id: string;
  at: number;
  message: string;
  /** السطر المباشر الذي رآه المستخدم على الشاشة */
  userMessage: string;
  route: string;
  source: "build" | "runtime" | "promise" | "boundary";
  stack?: string;
};

const STORAGE_KEY = "hk-preview-errors";
const MAX_ENTRIES = 50;

type Listener = (entries: PreviewErrorEntry[]) => void;
const listeners = new Set<Listener>();

export function readPreviewErrors(): PreviewErrorEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PreviewErrorEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: PreviewErrorEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(entries));
}

export function clearPreviewErrors() {
  if (typeof window === "undefined") return;
  write([]);
}

export function subscribePreviewErrors(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function messageOf(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: error.message || error.name, stack: error.stack };
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
}

/** الرسالة المباشرة التي يراها المستخدم على الشاشة عند هذا النوع من الخطأ */
function userLineFor(message: string, source: PreviewErrorEntry["source"]): string {
  const m = message.toLowerCase();
  if (source === "build" || m.includes("failed to fetch dynamically imported module") || m.includes("importing a module script")) {
    return "صار خطأ غير متوقع — جرّب تحدّث الصفحة.";
  }
  if (m.includes("networkerror") || m.includes("failed to fetch")) {
    return "تعذّر الاتصال بالخادم — تحقّق من الإنترنت وأعد المحاولة.";
  }
  if (m.includes("unauthorized") || m.includes("401")) {
    return "انتهت الجلسة — سجّل الدخول مرة أخرى.";
  }
  return "صار خطأ غير متوقع — جرّب تحدّث الصفحة.";
}

export function recordPreviewError(error: unknown, source: PreviewErrorEntry["source"] = "runtime") {
  if (typeof window === "undefined") return;
  const { message, stack } = messageOf(error);
  if (!message) return;
  const entries = readPreviewErrors();
  const last = entries[0];
  // لا نكرّر نفس الخطأ خلال ثانيتين
  if (last && last.message === message && Date.now() - last.at < 2000) return;
  const entry: PreviewErrorEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    message,
    userMessage: userLineFor(message, source),
    route: window.location.pathname + window.location.search,
    source,
    stack: stack?.split("\n").slice(0, 6).join("\n"),
  };
  write([entry, ...entries]);
}

let installed = false;
export function installPreviewErrorCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (event) => {
    const err = (event as ErrorEvent).error ?? (event as ErrorEvent).message;
    const isModule = String((event as ErrorEvent).message ?? "").includes("module");
    recordPreviewError(err, isModule ? "build" : "runtime");
  });
  window.addEventListener("unhandledrejection", (event) => {
    recordPreviewError((event as PromiseRejectionEvent).reason, "promise");
  });
}
