/**
 * Backfill strategy for a past Hijri year: which month starts are already
 * confirmed, which still need a source, and the dates each missing start could
 * fall on (derived from a neighbouring confirmed month's 29/30-day length).
 * Read-only; the CLI prints the report and a human fills the confirmed record.
 */
import type { HijriDate, MonthName } from "../types.js";
import { addDays, hijriKey } from "../dates.js";
import { BASELINE_NAME, hijriToGregorian } from "../hijri/baseline.js";
import { monthName } from "../hijri/months.js";
import type { ConfirmedMonth, NormalizedOverrides } from "../hijri/overrides.js";

export type BackfillStatus = "confirmed" | "needs-source";

export interface BackfillMonth {
  hijri: HijriDate;
  hijriKey: string;
  monthName: MonthName;
  /** Gregorian date the Umm al-Qura baseline gives the 1st. */
  baselineGregorian: string;
  status: BackfillStatus;
  /** Confirmed Gregorian date, or null when the month still needs a source. */
  confirmedDate: string | null;
  /** Source URLs behind a confirmed date. */
  sources: string[];
  /** Gregorian dates the 1st could fall on; the confirmed date once known. */
  candidates: string[];
}

export interface BackfillReport {
  hijriYear: number;
  baseline: string;
  coverageStart: string | null;
  months: BackfillMonth[];
  confirmedCount: number;
  needsSourceCount: number;
}

/** The 1st of the month before/after `hijri`, rolling the year when needed. */
function neighbourKey(hijri: HijriDate, offset: number): string {
  const month = hijri.month + offset;
  if (month < 1) return hijriKey({ year: hijri.year - 1, month: 12, day: 1 });
  if (month > 12) return hijriKey({ year: hijri.year + 1, month: 1, day: 1 });
  return hijriKey({ year: hijri.year, month, day: 1 });
}

/**
 * The two dates a month can start on, using the month-length constraint from a
 * confirmed neighbour (proposal section 8.2). Falls back to the baseline day
 * and the day after when neither neighbour is confirmed.
 */
function candidatesFor(
  hijri: HijriDate,
  confirmedByKey: Map<string, ConfirmedMonth>,
  baselineGregorian: string,
): string[] {
  const previous = confirmedByKey.get(neighbourKey(hijri, -1));
  if (previous !== undefined) return [addDays(previous.gregorian, 29), addDays(previous.gregorian, 30)];
  const next = confirmedByKey.get(neighbourKey(hijri, 1));
  if (next !== undefined) return [addDays(next.gregorian, -30), addDays(next.gregorian, -29)];
  return [baselineGregorian, addDays(baselineGregorian, 1)];
}

export function buildBackfillReport(options: {
  hijriYear: number;
  overrides: NormalizedOverrides;
}): BackfillReport {
  const confirmedByKey = new Map(options.overrides.months.map((month) => [month.hijriKey, month]));
  const months: BackfillMonth[] = [];

  for (let month = 1; month <= 12; month += 1) {
    const hijri: HijriDate = { year: options.hijriYear, month, day: 1 };
    const key = hijriKey(hijri);
    const baselineGregorian = hijriToGregorian(hijri);
    const confirmed = confirmedByKey.get(key);
    const isConfirmed = confirmed !== undefined && confirmed.hijri.year === options.hijriYear;
    months.push({
      hijri,
      hijriKey: key,
      monthName: monthName(month),
      baselineGregorian,
      status: isConfirmed ? "confirmed" : "needs-source",
      confirmedDate: isConfirmed ? confirmed.gregorian : null,
      sources: isConfirmed ? confirmed.sources : [],
      candidates:
        isConfirmed && confirmed !== undefined
          ? [confirmed.gregorian]
          : candidatesFor(hijri, confirmedByKey, baselineGregorian),
    });
  }

  const confirmedCount = months.filter((month) => month.status === "confirmed").length;
  return {
    hijriYear: options.hijriYear,
    baseline: BASELINE_NAME,
    coverageStart: options.overrides.coverageStart,
    months,
    confirmedCount,
    needsSourceCount: months.length - confirmedCount,
  };
}

function monthLabel(month: BackfillMonth): string {
  return `1 ${month.monthName.en} ${month.hijri.year} (${month.monthName.ur})`;
}

/**
 * A Markdown checklist a maintainer or a second reviewer works through: the
 * confirmed months to re-verify, then the ones that still need a source.
 */
export function renderBackfillMarkdown(report: BackfillReport): string {
  const confirmed = report.months.filter((month) => month.status === "confirmed");
  const missing = report.months.filter((month) => month.status === "needs-source");
  const lines: string[] = [
    `# Backfill report: Hijri year ${report.hijriYear} AH`,
    "",
    `- Baseline: \`${report.baseline}\``,
    `- Coverage starts: ${report.coverageStart ?? "none"}`,
    `- Confirmed: ${report.confirmedCount}/12 — needing a source: ${report.needsSourceCount}`,
    "",
    "## Confirmed — re-verify each source",
    "",
  ];

  if (confirmed.length === 0) {
    lines.push("_None yet._", "");
  } else {
    lines.push("| Hijri 1st | Gregorian | Sources |", "|---|---|---|");
    for (const month of confirmed) {
      lines.push(`| ${monthLabel(month)} | ${month.confirmedDate} | ${month.sources.join(" ")} |`);
    }
    lines.push("");
  }

  lines.push("## Needs a source", "");
  if (missing.length === 0) {
    lines.push("_None: the year is fully confirmed._", "");
  } else {
    for (const month of missing) {
      lines.push(
        `- [ ] ${monthLabel(month)} — candidates ${month.candidates.join(" / ")} ` +
          `(baseline ${month.baselineGregorian}) — source: ____`,
      );
    }
    lines.push("");
  }

  lines.push(
    "Add each verified start to `data/hijri/overrides.json` with its source, then run",
    "`npm run generate` and open a pull request using the backfill-month template.",
    "",
  );
  return lines.join("\n");
}
