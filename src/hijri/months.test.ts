import { describe, expect, it } from "vitest";
import { HIJRI_MONTHS, MONTH_NAME_VARIANTS, monthNameVariants } from "./months.js";

describe("MONTH_NAME_VARIANTS", () => {
  it("is keyed by Hijri month number, 1 through 12", () => {
    expect(Object.keys(MONTH_NAME_VARIANTS).map(Number).sort((a, b) => a - b)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    );
  });

  it("lines each row up with the month number, not the array offset", () => {
    expect(monthNameVariants(1)).toContain("Muharram");
    expect(monthNameVariants(3)).toContain("Rabi al-Awwal");
    expect(monthNameVariants(9)).toContain("Ramadan");
    expect(monthNameVariants(12)).toContain("Dhu al-Hijjah");
    expect(monthNameVariants(1)).not.toContain("Safar");
    expect(monthNameVariants(12)).not.toContain("Muharram");
  });

  it("every month has at least one ASCII spelling and the Urdu name", () => {
    for (let month = 1; month <= 12; month += 1) {
      const variants = monthNameVariants(month);
      expect(variants.length).toBeGreaterThan(0);
      expect(variants.some((variant) => /[a-z]/i.test(variant))).toBe(true);
      expect(variants).toContain(HIJRI_MONTHS[month - 1]?.ur);
    }
  });

  it("covers every month with romanisations but leaves no gaps", () => {
    for (let month = 1; month <= 12; month += 1) {
      expect(MONTH_NAME_VARIANTS[month]).toBeDefined();
    }
  });

  it("returns an empty list for an out-of-range month", () => {
    expect(monthNameVariants(0)).toEqual([]);
    expect(monthNameVariants(13)).toEqual([]);
  });
});
