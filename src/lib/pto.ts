/**
 * PTO utility functions — isomorphic (works in browser and Node.js).
 * Used both for client-side live preview and authoritative server-side calculation.
 */

/** Format a Date as "YYYY-MM-DD" using local calendar (not UTC). */
function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Compute Easter Sunday for a given year using the
 * Meeus/Jones/Butcher algorithm. Returns a local-midnight Date.
 */
export function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day); // local midnight
}

/**
 * Returns the set of German national public holidays for a given year
 * as "YYYY-MM-DD" strings (local calendar).
 *
 * The 9 federal holidays that apply across all German states:
 *   Fixed:         Neujahr, Tag der Arbeit, Tag der Deutschen Einheit,
 *                  1. + 2. Weihnachtstag
 *   Easter-based:  Karfreitag, Ostermontag, Christi Himmelfahrt, Pfingstmontag
 */
export function getGermanNationalHolidays(year: number): Set<string> {
  const easter = getEasterSunday(year);

  function offset(days: number): string {
    const d = new Date(easter);
    d.setDate(d.getDate() + days);
    return toYMD(d);
  }

  return new Set([
    // Fixed
    `${year}-01-01`, // Neujahr
    `${year}-05-01`, // Tag der Arbeit
    `${year}-10-03`, // Tag der Deutschen Einheit
    `${year}-12-25`, // 1. Weihnachtstag
    `${year}-12-26`, // 2. Weihnachtstag
    // Easter-relative
    offset(-2),  // Karfreitag (Good Friday)
    offset(+1),  // Ostermontag (Easter Monday)
    offset(+39), // Christi Himmelfahrt (Ascension)
    offset(+50), // Pfingstmontag (Whit Monday)
  ]);
}

/**
 * Count the number of working days between two dates (inclusive),
 * excluding weekends and German national public holidays.
 *
 * Both dates should be constructed as local-midnight (e.g. new Date("2025-04-01T00:00:00")).
 * Returns 0 if start > end.
 */
export function countWorkingDays(start: Date, end: Date): number {
  if (start > end) return 0;

  // Pre-compute holiday sets; cache by year to avoid recomputing for long ranges
  const holidayCache = new Map<number, Set<string>>();
  function getHolidays(year: number): Set<string> {
    if (!holidayCache.has(year)) {
      holidayCache.set(year, getGermanNationalHolidays(year));
    }
    return holidayCache.get(year)!;
  }

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dow = current.getDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) {
      const ymd = toYMD(current);
      const holidays = getHolidays(current.getFullYear());
      if (!holidays.has(ymd)) {
        count++;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
