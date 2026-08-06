/**
 * تخزين مفاتيح الربط (أمازون / نون) مشفّرة داخل قاعدة البيانات.
 * - التشفير AES-256-GCM بمفتاح مشتق من INTEGRATION_KEYS_ENC_SECRET (خادم فقط).
 * - القيم لا تُعاد أبدًا إلى الواجهة؛ تُستعمل داخل الخادم فقط.
 */

export const INTEGRATION_KEY_NAMES = [
  "AMAZON_ACCESS_KEY",
  "AMAZON_SECRET_KEY",
  "AMAZON_PARTNER_TAG",
  "NOON_AFFILIATE_ID",
] as const;

export type IntegrationKeyName = (typeof INTEGRATION_KEY_NAMES)[number];

export function isIntegrationKeyName(value: string): value is IntegrationKeyName {
  return (INTEGRATION_KEY_NAMES as readonly string[]).includes(value);
}

const enc = new TextEncoder();
const dec = new TextDecoder();

async function aesKey(): Promise<CryptoKey> {
  const secret = process.env["INTEGRATION_KEYS_ENC_SECRET"];
  if (!secret) throw new Error("INTEGRATION_KEYS_ENC_SECRET is not set");
  const material = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const out = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function encryptValue(plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await aesKey();
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext)));
  const merged = new Uint8Array(iv.length + ct.length);
  merged.set(iv, 0);
  merged.set(ct, iv.length);
  return toBase64(merged);
}

export async function decryptValue(stored: string): Promise<string> {
  const raw = fromBase64(stored);
  const iv = raw.subarray(0, 12);
  const ct = raw.subarray(12);
  const key = await aesKey();
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(pt);
}

/* ------------------------------ cache ------------------------------ */

type CacheEntry = { value: string | null; at: number };
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

export function invalidateIntegrationKeyCache(name?: string) {
  if (name) cache.delete(name);
  else cache.clear();
}

/** يقرأ المفتاح من قاعدة البيانات (مشفّرًا) ثم يرجع لمتغيّر البيئة كخيار احتياطي. */
export async function getIntegrationKey(name: IntegrationKeyName): Promise<string | null> {
  const cached = cache.get(name);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  let value: string | null = null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("integration_credentials")
      .select("value_ciphertext")
      .eq("key_name", name)
      .maybeSingle();
    if (data?.value_ciphertext) value = (await decryptValue(data.value_ciphertext)).trim() || null;
  } catch (error) {
    console.error("integration key read failed", name, error);
  }

  if (!value) {
    const fromEnv = process.env[name];
    value = fromEnv && String(fromEnv).trim().length > 0 ? String(fromEnv).trim() : null;
  }

  cache.set(name, { value, at: Date.now() });
  return value;
}

export type IntegrationKeyPresence = {
  name: IntegrationKeyName;
  configured: boolean;
  storedInDatabase: boolean;
  updatedAt: string | null;
};

/** حالة المفاتيح فقط (مُفعّل / غير مُضاف) — لا تُعاد أي قيمة. */
export async function getIntegrationKeyPresence(): Promise<IntegrationKeyPresence[]> {
  let rows: Array<{ key_name: string; updated_at: string }> = [];
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("integration_credentials").select("key_name, updated_at");
    rows = data ?? [];
  } catch (error) {
    console.error("integration key presence failed", error);
  }

  return INTEGRATION_KEY_NAMES.map((name) => {
    const row = rows.find((r) => r.key_name === name);
    const inEnv = Boolean(process.env[name] && String(process.env[name]).trim().length > 0);
    return {
      name,
      configured: Boolean(row) || inEnv,
      storedInDatabase: Boolean(row),
      updatedAt: row?.updated_at ?? null,
    };
  });
}

export async function saveIntegrationKey(name: IntegrationKeyName, value: string, actorId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("integration_credentials").upsert(
    {
      key_name: name,
      value_ciphertext: await encryptValue(value.trim()),
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key_name" },
  );
  if (error) throw error;
  invalidateIntegrationKeyCache(name);
}

export async function deleteIntegrationKey(name: IntegrationKeyName) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("integration_credentials").delete().eq("key_name", name);
  if (error) throw error;
  invalidateIntegrationKeyCache(name);
}
