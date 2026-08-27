/**
 * حماية بوت تيليجرام: تحقق من ترويسة السر، حد معدل الرسائل، وتصفية الرسائل غير الصالحة.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const MAX_LEN = 1000;

const hits = new Map<string, number[]>();

export function isRateLimited(chatId: string | number, now = Date.now()): boolean {
  const key = String(chatId);
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export function resetTelegramGuard() {
  hits.clear();
}

export function isValidTelegramRequest(
  body: unknown,
  secret: string,
  headerSecret?: string | null,
): boolean {
  if (!secret || headerSecret !== secret) return false;
  if (!body || typeof body !== "object") return false;

  const message = (body as { message?: unknown }).message as
    | { text?: unknown; chat?: { id?: unknown } }
    | undefined;
  if (!message || typeof message !== "object") return false;

  const text = typeof message.text === "string" ? message.text.trim() : "";
  if (!text || text.length > MAX_LEN) return false;

  const chatId = message.chat?.id;
  if (chatId === undefined || chatId === null) return false;

  return !isRateLimited(chatId as string | number);
}
