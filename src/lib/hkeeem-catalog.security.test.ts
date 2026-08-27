import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** يثبت أن مفتاح التكامل لا يظهر في أي كود يصل إلى المتصفح */
describe("أمان مفتاح تكامل حكيم (الكتالوج)", () => {
  const clientDirs = ["src/components", "src/routes", "src/hooks", "src/data"];

  function walk(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = join(dir, e.name);
      if (e.isDirectory()) return walk(p);
      return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
    });
  }

  it("لا يُذكر HKEEEM_INTEGRATION_KEY في كود الواجهة", () => {
    const offenders = clientDirs
      .flatMap(walk)
      .filter((f) => !f.includes(".server.") && !/\.test\.tsx?$/.test(f))
      .filter((f) => readFileSync(f, "utf8").includes("HKEEEM_INTEGRATION_KEY"));
    expect(offenders).toEqual([]);
  });

  it("قسم الكتالوج لا يستورد وحدة الخادم ولا يقرأ متغيرات البيئة", () => {
    const src = readFileSync("src/components/HkeeemCatalogSection.tsx", "utf8");
    expect(src).not.toContain("hkeeem-catalog.server");
    expect(src).not.toContain("process.env");
    expect(src).not.toContain("VITE_HKEEEM");
  });
});
