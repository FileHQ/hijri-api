/**
 * Regression guard for the verified record: each date below is a Pakistan
 * Central Ruet-e-Hilal Committee announcement, confirmed from news sources and
 * backfilled into `data/hijri/overrides.json`. If the baseline or the override
 * chaining drifts, this test fails loudly.
 */
import { describe, expect, it } from "vitest";
import { HijriCalendar } from "../client/calendar.js";
import { buildCalendar } from "./calendar.js";
import { loadOverrides } from "./overrides.js";

/** Confirmed 1st-of-month Gregorian dates, from the committee announcements. */
const CONFIRMED: Record<string, string> = {
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
  "1448-01-01": "2026-06-17",
  "1448-02-01": "2026-07-16",
  "1448-03-01": "2026-08-15",
  "1448-04-01": "2026-09-14",
  "1448-05-01": "2026-10-13",
};

function calendarForRealOverrides(): HijriCalendar {
  const overrides = loadOverrides();
  const { files } = buildCalendar({
    hijriYears: [1447, 1448, 1449],
    overrides,
    today: "2026-10-17",
    generatedAt: "2026-10-17T00:00:00.000Z",
  });
  return HijriCalendar.fromFiles(files);
}

describe("confirmed Pakistan month starts", () => {
  const calendar = calendarForRealOverrides();

  for (const [hijri, gregorian] of Object.entries(CONFIRMED)) {
    it(`${gregorian} is ${hijri}`, () => {
      const entry = calendar.get(gregorian);
      expect(entry).toBeDefined();
      expect(entry?.hijri).toBe(hijri);
      expect(entry?.confidence).toBe("confirmed");
    });
  }

  it("covers the whole of 1447 AH", () => {
    const overrides = loadOverrides();
    const months = overrides.months.filter((month) => month.hijri.year === 1447);
    expect(months).toHaveLength(12);
  });
});
