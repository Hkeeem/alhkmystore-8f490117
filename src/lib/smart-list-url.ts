import { z } from "zod";

/**
 * URL <-> text helpers and search-param parsing for /smart-list.
 * Pure, SSR-safe (no window/document/localStorage access), and covered by
 * src/lib/__tests__/smart-list-url.test.ts.
 */

export const DEFAULT_TEXT = "أرز بسمتي\nزيت طبخ\nحليب\nدجاج\nبيض";

export const smartListSearchSchema = z.object({
  q: z.string().optional(),
  auto: z.coerce.number().optional(),
});

export type SmartListSearch = z.infer<typeof smartListSearchSchema>;

/** Decode a base64url-encoded shopping list. Returns null on empty/invalid. */
export function decodeQ(q?: string | null): string | null {
  if (!q) return null;
  try {
    const b64 = q.replace(/-/g, "+").replace(/_/g, "/");
    const bin =
      typeof atob !== "undefined"
        ? atob(b64)
        : Buffer.from(b64, "base64").toString("binary");
    // eslint-disable-next-line deprecation/deprecation
    const decoded = decodeURIComponent(escape(bin)).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

/** Encode a shopping-list string as URL-safe base64. Returns "" on failure. */
export function encodeQ(text: string): string {
  try {
    // eslint-disable-next-line deprecation/deprecation
    const bin = unescape(encodeURIComponent(text));
    const b64 =
      typeof btoa !== "undefined"
        ? btoa(bin)
        : Buffer.from(bin, "binary").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

export type InitialState = {
  /** Text to seed the textarea with. */
  text: string;
  /** Whether to auto-run buildSmartList after hydration. */
  autoSubmit: boolean;
  /** Optional Arabic notice to surface to the user. */
  notice: string | null;
};

/**
 * Given the parsed search params, compute the initial hydration state.
 * Isolated from React so it can be unit tested without a router or DOM.
 *
 * Rules:
 *   - Missing q → default text, no notice (unless auto=1 was requested).
 *   - Invalid q (bad base64 / empty payload) → default text + warning notice.
 *   - Valid q → decoded text; auto=1 triggers a submit.
 *   - auto=1 without q → default text + "missing q" notice.
 */
export function resolveInitialState(search: SmartListSearch): InitialState {
  const decoded = decodeQ(search.q);
  const wantsAuto = search.auto === 1;

  if (search.q && !decoded) {
    return {
      text: DEFAULT_TEXT,
      autoSubmit: false,
      notice: "الرابط لا يحتوي على قائمة صالحة — تم تحميل قائمة افتراضية.",
    };
  }

  if (decoded) {
    return { text: decoded, autoSubmit: wantsAuto, notice: null };
  }

  if (wantsAuto) {
    return {
      text: DEFAULT_TEXT,
      autoSubmit: false,
      notice:
        "الرابط ينقصه محتوى القائمة (q). اكتب منتجاتك وابنِ القائمة يدوياً.",
    };
  }

  return { text: DEFAULT_TEXT, autoSubmit: false, notice: null };
}

/** Build a deep-link URL for the given text and origin (SSR-safe). */
export function buildShareUrl(origin: string, text: string): string {
  if (!origin) return "";
  return `${origin}/smart-list?q=${encodeQ(text)}&auto=1`;
}
