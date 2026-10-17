/**
 * Guards the deployed product: the committed calendar files under `data/` must
 * already reflect `data/hijri/overrides.json`. Catches the common mistake of
 * editing the confirmed record and forgetting to run `npm run generate`.
 * Deterministic — it reads the checked-in files, no clock or timestamps.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HijriCalendar } from "./client/calendar.js";
import { loadOverrides } from "./hijri/overrides.js";
import { CALENDAR_DIR } from "./paths.js";
import type { CalendarFile } from "./types.js";

function loadCommittedCalendar(): HijriCalendar {
  const files = readdirSync(CALENDAR_DIR)
    .filter((name) => /^\d+\.json$/.test(name))
    .map((name) => JSON.parse(readFileSync(join(CALENDAR_DIR, name), "utf8")) as CalendarFile);
  return HijriCalendar.fromFiles(files);
}

describe("committed calendar data", () => {
  const overrides = loadOverrides();
  const calendar = loadCommittedCalendar();

  it("reflects every confirmed month start as confirmed", () => {
    for (const month of overrides.months) {
      const entry = calendar.get(month.gregorian);
      expect(entry, `${month.hijriKey} (${month.gregorian}) is missing from data/`).toBeDefined();
      expect(entry?.hijri).toBe(month.hijriKey);
      expect(entry?.confidence).toBe("confirmed");
    }
  });

  it("carries the sources recorded in overrides.json", () => {
    for (const month of overrides.months) {
      expect(calendar.get(month.gregorian)?.sources).toEqual(month.sources);
    }
  });
});
