import fs from "node:fs";
import path from "node:path";

const [sourcePath, outputPath] = process.argv.slice(2);

if (!sourcePath || !outputPath) {
  throw new Error("Usage: node scripts/build-saudi-locations.mjs <source-csv> <output-ts>");
}

const rows = fs
  .readFileSync(sourcePath, "utf8")
  .replace(/^\uFEFF/, "")
  .trim()
  .split(/\r?\n/)
  .slice(1);
const hierarchy = new Map();

for (const row of rows) {
  const [district, _districtEn, city, region] = row.split(",").map((value) => value.trim());
  if (!district || !city || !region) continue;
  if (!hierarchy.has(region)) hierarchy.set(region, new Map());
  const cities = hierarchy.get(region);
  if (!cities.has(city)) cities.set(city, new Set());
  cities.get(city).add(district);
}

const locations = Object.fromEntries(
  [...hierarchy.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "ar"))
    .map(([region, cities]) => [
      region,
      Object.fromEntries(
        [...cities.entries()]
          .sort(([a], [b]) => a.localeCompare(b, "ar"))
          .map(([city, districts]) => [
            city,
            [...districts].sort((a, b) => a.localeCompare(b, "ar")),
          ]),
      ),
    ]),
);

const output = `/*\n * Generated from \"KSA Regions Cities and Districts\" by Mohammed Alsubaie.\n * Source: https://www.kaggle.com/datasets/mohammedalsubaie/ksa-regions-cities-and-districts\n * License: Apache-2.0. Refresh with: node scripts/build-saudi-locations.mjs <csv> src/data/saudi-locations.ts\n */\n\nexport type SaudiLocationIndex = Record<string, Record<string, string[]>>;\n\nexport const SAUDI_LOCATION_INDEX: SaudiLocationIndex = ${JSON.stringify(locations, null, 2)} as const;\n\nexport const SAUDI_REGIONS = Object.keys(SAUDI_LOCATION_INDEX);\n\nexport function getSaudiCities(region: string): string[] {\n  return region ? Object.keys(SAUDI_LOCATION_INDEX[region] ?? {}) : [];\n}\n\nexport function getSaudiDistricts(region: string, city: string): string[] {\n  return region && city ? SAUDI_LOCATION_INDEX[region]?.[city] ?? [] : [];\n}\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, "utf8");
console.log(`Generated ${outputPath} with ${rows.length} location rows.`);
