import { describe, it, expect } from "vitest";
import {
  DEFAULT_TEXT,
  buildShareUrl,
  decodeQ,
  encodeQ,
  resolveInitialState,
  smartListSearchSchema,
} from "@/lib/smart-list-url";

describe("smart-list url helpers", () => {
  describe("encodeQ / decodeQ round-trip", () => {
    it("round-trips ASCII text", () => {
      const text = "milk\nbread\neggs";
      expect(decodeQ(encodeQ(text))).toBe(text);
    });

    it("round-trips Arabic (multi-byte UTF-8) text", () => {
      const text = "أرز بسمتي\nزيت طبخ\nحليب\nدجاج\nبيض";
      expect(decodeQ(encodeQ(text))).toBe(text);
    });

    it("round-trips mixed Arabic + emoji + newlines", () => {
      const text = "حليب 🥛\nخبز 🍞\nتمر 🌴";
      expect(decodeQ(encodeQ(text))).toBe(text);
    });

    it("produces URL-safe base64 (no +, /, or =)", () => {
      const enc = encodeQ("قائمة كبيرة جداً مع محارف متعددة ????>>>");
      expect(enc).not.toMatch(/[+/=]/);
    });

    it("trims surrounding whitespace on decode", () => {
      const enc = encodeQ("   حليب\n   ");
      expect(decodeQ(enc)).toBe("حليب");
    });
  });

  describe("decodeQ edge cases", () => {
    it("returns null for undefined", () => {
      expect(decodeQ(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(decodeQ("")).toBeNull();
    });

    it("returns null for whitespace-only payload", () => {
      expect(decodeQ(encodeQ("   \n \t "))).toBeNull();
    });

    it("returns null for garbage that isn't base64", () => {
      expect(decodeQ("!!!not-base64!!!")).toBeNull();
    });

    it("returns null for malformed UTF-8 sequences", () => {
      // Raw bytes 0xC3 0x28 form an invalid UTF-8 sequence.
      const malformed = Buffer.from([0xc3, 0x28]).toString("base64");
      expect(decodeQ(malformed)).toBeNull();
    });
  });

  describe("smartListSearchSchema", () => {
    it("accepts empty search object", () => {
      expect(smartListSearchSchema.parse({})).toEqual({});
    });

    it("coerces auto from string '1' to number 1", () => {
      const out = smartListSearchSchema.parse({ q: "abc", auto: "1" });
      expect(out.auto).toBe(1);
      expect(out.q).toBe("abc");
    });

    it("coerces auto from number 1", () => {
      expect(smartListSearchSchema.parse({ auto: 1 }).auto).toBe(1);
    });

    it("rejects non-numeric auto values by producing NaN (guarded downstream)", () => {
      const out = smartListSearchSchema.parse({ auto: "yes" });
      expect(Number.isNaN(out.auto)).toBe(true);
      // resolveInitialState treats non-1 as "no auto".
      expect(resolveInitialState(out).autoSubmit).toBe(false);
    });

    it("keeps q as-is (string)", () => {
      expect(smartListSearchSchema.parse({ q: "xyz" }).q).toBe("xyz");
    });
  });

  describe("resolveInitialState", () => {
    it("returns default state for empty search", () => {
      expect(resolveInitialState({})).toEqual({
        text: DEFAULT_TEXT,
        autoSubmit: false,
        notice: null,
      });
    });

    it("hydrates text from a valid q without auto", () => {
      const q = encodeQ("حليب\nخبز");
      expect(resolveInitialState({ q })).toEqual({
        text: "حليب\nخبز",
        autoSubmit: false,
        notice: null,
      });
    });

    it("sets autoSubmit=true only when q is valid AND auto=1", () => {
      const q = encodeQ("حليب");
      expect(resolveInitialState({ q, auto: 1 }).autoSubmit).toBe(true);
    });

    it("does NOT autoSubmit when auto !== 1", () => {
      const q = encodeQ("حليب");
      expect(resolveInitialState({ q, auto: 0 }).autoSubmit).toBe(false);
      expect(resolveInitialState({ q, auto: 2 }).autoSubmit).toBe(false);
    });

    it("surfaces a warning notice for invalid q and falls back to default text", () => {
      const state = resolveInitialState({ q: "!!!bad!!!", auto: 1 });
      expect(state.text).toBe(DEFAULT_TEXT);
      expect(state.autoSubmit).toBe(false);
      expect(state.notice).toMatch(/غير.*صالح/);
    });

    it("surfaces 'missing q' notice when auto=1 without q", () => {
      const state = resolveInitialState({ auto: 1 });
      expect(state.text).toBe(DEFAULT_TEXT);
      expect(state.autoSubmit).toBe(false);
      expect(state.notice).toMatch(/ينقصه/);
    });

    it("does NOT autoSubmit when q decodes to whitespace only", () => {
      const q = encodeQ("   ");
      const state = resolveInitialState({ q, auto: 1 });
      // Whitespace-only decodes to null, so it's the invalid-q branch.
      expect(state.autoSubmit).toBe(false);
      expect(state.text).toBe(DEFAULT_TEXT);
      expect(state.notice).toMatch(/غير.*صالح/);
    });
  });

  describe("buildShareUrl", () => {
    it("returns empty string for empty origin (SSR-safe)", () => {
      expect(buildShareUrl("", "حليب")).toBe("");
    });

    it("produces a deep link with auto=1 and encoded q", () => {
      const url = buildShareUrl("https://waffer.app", "حليب\nخبز");
      expect(url).toMatch(/^https:\/\/waffer\.app\/smart-list\?q=[^&]+&auto=1$/);
      const q = new URL(url).searchParams.get("q");
      expect(decodeQ(q)).toBe("حليب\nخبز");
    });
  });

  describe("SSR safety", () => {
    it("does not touch window/document (helpers are pure)", () => {
      // Guard: fail loudly if any helper referenced browser globals at eval.
      // Running in vitest's node env, `window` is undefined and these calls
      // must still succeed.
      expect(typeof (globalThis as { window?: unknown }).window).toBe("undefined");
      expect(() => encodeQ("test")).not.toThrow();
      expect(() => decodeQ("dGVzdA")).not.toThrow();
      expect(() => resolveInitialState({ q: "dGVzdA", auto: 1 })).not.toThrow();
      expect(() => buildShareUrl("", "x")).not.toThrow();
    });
  });
});
