import { describe, expect, it } from "vitest";
import { parseOverrides } from "../hijri/overrides.js";
import { buildBackfillReport, renderBackfillMarkdown } from "./backfill.js";

function overridesWith(months: Record<string, string>): ReturnType<typeof parseOverrides> {
  const entries = Object.fromEntries(
    Object.entries(months).map(([key, date]) => [key, { date, sources: [`https://example.test/${key}`] }]),
  );
  return parseOverrides({ coverage_start: Object.values(months)[0] ?? null, months: entries });
}

describe("buildBackfillReport", () => {
  it("marks every month of a fully confirmed year as confirmed", () => {
    const report = buildBackfillReport({
      hijriYear: 1447,
      overrides: overridesWith({
        "1447-01-01": "2025-06-27",
        "1447-02-01": "2025-07-27",
        "1447-03-01": "2025-08-26",
        "1447-04-01": "2025-09-25",
        "1447-05-01": "2025-10-24",
        "1447-06-01": "2025-11-23",
        "1447-07-01": "2025-12-22",
        "1447-08-01": "2026-01-21",
        "1447-09-01": "2026-02-19",
        "1447-10-01": "2026-03-21",
        "1447-11-01": "2026-04-19",
        "1447-12-01": "2026-05-18",
      }),
    });

    expect(report.confirmedCount).toBe(12);
    expect(report.needsSourceCount).toBe(0);
    expect(report.months.every((month) => month.status === "confirmed")).toBe(true);
    expect(report.months[0]).toMatchObject({
      hijriKey: "1447-01-01",
      confirmedDate: "2025-06-27",
      candidates: ["2025-06-27"],
    });
  });

  it("derives candidates from the following confirmed month", () => {
    const report = buildBackfillReport({
      hijriYear: 1448,
      overrides: overridesWith({ "1448-04-01": "2026-09-14", "1448-05-01": "2026-10-13" }),
    });

    const rabi = report.months.find((month) => month.hijriKey === "1448-03-01");
    // 1 Rabi al-Thani 1448 is 2026-09-14, so Rabi al-Awwal starts 29 or 30 days earlier.
    expect(rabi?.status).toBe("needs-source");
    expect(rabi?.candidates).toEqual(["2026-08-15", "2026-08-16"]);

    const jumadaThani = report.months.find((month) => month.hijriKey === "1448-06-01");
    expect(jumadaThani?.candidates).toEqual(["2026-11-11", "2026-11-12"]);
    expect(report.needsSourceCount).toBe(10);
  });

  it("falls back to the baseline window when neither neighbour is confirmed", () => {
    const report = buildBackfillReport({
      hijriYear: 1448,
      overrides: overridesWith({ "1448-05-01": "2026-10-13" }),
    });

    const muharram = report.months[0];
    expect(muharram?.status).toBe("needs-source");
    expect(muharram?.candidates).toHaveLength(2);
    expect(muharram?.candidates[0]).toBe(muharram?.baselineGregorian);
  });
});

describe("renderBackfillMarkdown", () => {
  const report = buildBackfillReport({
    hijriYear: 1448,
    overrides: overridesWith({ "1448-04-01": "2026-09-14", "1448-05-01": "2026-10-13" }),
  });
  const markdown = renderBackfillMarkdown(report);

  it("lists each confirmed month with its sources", () => {
    expect(markdown).toContain("| 1 Rabi al-Thani 1448 (ربیع الثانی) | 2026-09-14 |");
    expect(markdown).toContain("https://example.test/1448-04-01");
  });

  it("gives every unconfirmed month a checklist item with candidates", () => {
    expect(markdown.match(/- \[ \]/g)).toHaveLength(report.needsSourceCount);
    expect(markdown).toContain("- [ ] 1 Rabi al-Awwal 1448 (ربیع الاول) — candidates 2026-08-15 / 2026-08-16");
  });
});
