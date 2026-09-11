import { describe, it, expect, beforeEach } from "vitest";
import { isValidTelegramRequest, resetTelegramGuard } from "./telegram-guard";

const SECRET = "s3cret";
const body = (text: string) => ({ message: { text, chat: { id: 99 } } });

beforeEach(() => resetTelegramGuard());

describe("حارس تيليجرام", () => {
  it("يرفض الطلب عند اختلاف ترويسة السر", () => {
    expect(isValidTelegramRequest(body("مرحبا"), SECRET, "wrong")).toBe(false);
  });

  it("يقبل رسالة صالحة", () => {
    expect(isValidTelegramRequest(body("مرحبا"), SECRET, SECRET)).toBe(true);
  });

  it("يتجاهل الرسائل الفارغة والطويلة", () => {
    expect(isValidTelegramRequest(body("   "), SECRET, SECRET)).toBe(false);
    expect(isValidTelegramRequest(body("x".repeat(1001)), SECRET, SECRET)).toBe(false);
  });

  it("يحد المعدل عند تجاوز ٥ رسائل بالدقيقة", () => {
    for (let i = 0; i < 5; i++)
      expect(isValidTelegramRequest(body(`m${i}`), SECRET, SECRET)).toBe(true);
    expect(isValidTelegramRequest(body("m6"), SECRET, SECRET)).toBe(false);
  });
});
