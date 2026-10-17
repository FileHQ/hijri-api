import type { HijriDate, MonthName } from "../types.js";

/** The twelve Hijri months with English and Urdu names. Index 0 is Muharram. */
export const HIJRI_MONTHS: readonly MonthName[] = [
  { en: "Muharram", ur: "محرم" },
  { en: "Safar", ur: "صفر" },
  { en: "Rabi al-Awwal", ur: "ربیع الاول" },
  { en: "Rabi al-Thani", ur: "ربیع الثانی" },
  { en: "Jumada al-Awwal", ur: "جمادی الاول" },
  { en: "Jumada al-Thani", ur: "جمادی الثانی" },
  { en: "Rajab", ur: "رجب" },
  { en: "Sha'ban", ur: "شعبان" },
  { en: "Ramadan", ur: "رمضان" },
  { en: "Shawwal", ur: "شوال" },
  { en: "Dhu al-Qi'dah", ur: "ذو القعدہ" },
  { en: "Dhu al-Hijjah", ur: "ذو الحجہ" },
];

export const RAMADAN_MONTH = 9;

/**
 * Spellings publishers actually use for each month: common romanisations plus
 * the Urdu name, used to recognise a headline as being about the target month.
 * Keyed by Hijri month number (1 = Muharram) so a row can never drift out of
 * alignment with its month. Never rely on a single transliteration.
 */
export const MONTH_NAME_VARIANTS: Readonly<Record<number, readonly string[]>> = {
  1: ["Muharram", "Moharram", "Muharram al-Haram", "محرم"],
  2: ["Safar", "Saffar", "Safar al-Muzaffar", "صفر"],
  3: ["Rabi al-Awwal", "Rabi-ul-Awwal", "Rabi ul Awwal", "Rabiul Awwal", "Rabi ul Awal", "Rabi-ul-Awal", "Rabi al Awal", "Rabbiul Awwal", "ربیع الاول"],
  4: ["Rabi al-Thani", "Rabi-ul-Thani", "Rabi us Sani", "Rabi ul-Sani", "Rabi ul Sani", "Rabi-us-Sani", "ربیع الثانی"],
  5: ["Jumada al-Awwal", "Jumada al Awwal", "Jumada al Awal", "Jamadi ul Awwal", "Jamadi-ul-Awwal", "Jamadi-ul-Awal", "Jumadi-ul-Awwal", "جمادی الاول"],
  6: ["Jumada al-Thani", "Jumada al Thani", "Jumada al Sani", "Jamadi ul Thani", "Jamadi ul Sani", "Jamadi-ul-Thani", "جمادی الثانی"],
  7: ["Rajab", "Rajab al-Murajjab", "رجب"],
  8: ["Sha'ban", "Shaban", "Shaaban", "شعبان"],
  9: ["Ramadan", "Ramazan", "Ramadhan", "رمضان"],
  10: ["Shawwal", "Shawal", "شوال"],
  11: ["Dhu al-Qi'dah", "Zil Qadah", "Zilqad", "Zul Qadah", "Ziqad", "ذو القعدہ"],
  12: ["Dhu al-Hijjah", "Zil Hajj", "Zilhaj", "Zilhajj", "Dhul Hijjah", "Zul Hijjah", "ذو الحجہ"],
};

export function monthName(month: number): MonthName {
  const found = HIJRI_MONTHS[month - 1];
  return found ?? { en: `Month ${month}`, ur: "" };
}

/** Every known spelling of `month` (1-12), including the Urdu name. */
export function monthNameVariants(month: number): readonly string[] {
  return MONTH_NAME_VARIANTS[month] ?? [];
}

export function isRamadan(month: number): boolean {
  return month === RAMADAN_MONTH;
}

/** The 1st of the month after `hijri`. */
export function nextHijriMonth(hijri: HijriDate): HijriDate {
  return hijri.month === 12
    ? { year: hijri.year + 1, month: 1, day: 1 }
    : { year: hijri.year, month: hijri.month + 1, day: 1 };
}
