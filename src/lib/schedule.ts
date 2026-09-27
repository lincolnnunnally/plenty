const DAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function hourNorm(h: number) {
  return h === 24 ? 0 : h;
}

export const DEFAULT_PICKUP_TIMEZONE = "America/New_York";

type ZoneRow = { timezone?: string | null; time_zone?: string | null } | null | undefined;

/** IANA name, or null when the string is blank or not a real zone. */
export function validTimeZone(value: string | null | undefined): string | null {
  const zone = String(value || "").trim();
  if (!zone) return null;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: zone }).format(new Date());
    return zone;
  } catch {
    return null;
  }
}

/** Location zone wins, then the pantry zone. Otherwise America/New_York. */
export function resolvePickupTimeZone(input: { location?: ZoneRow; pantry?: ZoneRow } = {}): string {
  return (
    validTimeZone(input.location?.timezone || input.location?.time_zone) ||
    validTimeZone(input.pantry?.timezone || input.pantry?.time_zone) ||
    DEFAULT_PICKUP_TIMEZONE
  );
}

function zoneOffsetMinutes(instant: Date, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).formatToParts(instant);
    const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
    const asUtc = Date.UTC(
      Number(get("year")),
      Number(get("month")) - 1,
      Number(get("day")),
      hourNorm(Number(get("hour"))),
      Number(get("minute")),
      Number(get("second"))
    );
    return Math.round((asUtc - instant.getTime()) / 60000);
  } catch {
    return null;
  }
}

function wallMatches(instant: Date, timeZone: string, year: string, month: string, day: string, hour: number, minute: number, second: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(instant);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return (
    get("year") === year &&
    get("month") === month &&
    get("day") === day &&
    hourNorm(Number(get("hour"))) === hour &&
    Number(get("minute")) === minute &&
    Number(get("second")) === second
  );
}

/**
 * A datetime-local value is wall time in `timeZone`, including daylight saving.
 * A value that already carries Z or an offset is an absolute instant and is kept.
 */
export function parseZonedDateTime(value: string, timeZone = DEFAULT_PICKUP_TIMEZONE): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const zone = validTimeZone(timeZone) || DEFAULT_PICKUP_TIMEZONE;
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(raw)) {
    const absolute = new Date(raw);
    return Number.isNaN(absolute.getTime()) ? null : absolute.toISOString();
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
  if (!match) return null;
  const [, year, month, day, hh, mm, ss = "00"] = match;
  const hour = Number(hh);
  const minute = Number(mm);
  const second = Number(ss);
  const wallUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), hour, minute, second);
  const first = zoneOffsetMinutes(new Date(wallUtc), zone);
  if (first == null) return null;
  let instant = wallUtc - first * 60000;
  const secondOffset = zoneOffsetMinutes(new Date(instant), zone);
  if (secondOffset != null && secondOffset !== first) instant = wallUtc - secondOffset * 60000;
  const candidate = new Date(instant);
  if (!wallMatches(candidate, zone, year, month, day, hour, minute, second)) return null;
  return candidate.toISOString();
}

export function parseEasternDateTime(value: string): string | null {
  return parseZonedDateTime(value, DEFAULT_PICKUP_TIMEZONE);
}

/** Value for an input type="datetime-local" in the pantry or location zone. */
export function zonedLocalInput(iso: string | null | undefined, timeZone = DEFAULT_PICKUP_TIMEZONE): string {
  if (!iso) return "";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const zone = validTimeZone(timeZone) || DEFAULT_PICKUP_TIMEZONE;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(at);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export function easternLocalInput(iso: string | null | undefined): string {
  return zonedLocalInput(iso, DEFAULT_PICKUP_TIMEZONE);
}

/** Field label. America/New_York stays "Eastern"; any other zone is named. */
export function pickupTimeLabel(timeZone: string | null | undefined, prefix = "When"): string {
  const zone = validTimeZone(timeZone) || DEFAULT_PICKUP_TIMEZONE;
  const name = zone === DEFAULT_PICKUP_TIMEZONE ? "Eastern" : zone;
  return `${prefix} (${name})`;
}

/** Next America/New_York wall-clock occurrence of weekday + HH:MM. */
export function nextEasternOccurrence(weekday: number, timeLocal: string, now = new Date()): Date {
  const [hhRaw, mmRaw] = timeLocal.split(":").map(Number);
  const hh = hourNorm(hhRaw);
  const mm = mmRaw || 0;
  for (let i = 0; i < 8; i++) {
    const probe = new Date(now.getTime() + i * 86400000);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(probe);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
    if ((DAY[get("weekday")] ?? -1) !== weekday) continue;
    const y = get("year");
    const mo = get("month");
    const d = get("day");
    for (const off of ["-04:00", "-05:00"]) {
      const candidate = new Date(`${y}-${mo}-${d}T${pad(hh)}:${pad(mm)}:00${off}`);
      const check = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).formatToParts(candidate);
      const ch = hourNorm(Number(check.find((p) => p.type === "hour")?.value));
      const cm = Number(check.find((p) => p.type === "minute")?.value);
      const cd = check.find((p) => p.type === "day")?.value;
      if (ch === hh && cm === mm && cd === d && candidate.getTime() >= now.getTime() - 30 * 60 * 1000) {
        return candidate;
      }
    }
  }
  return new Date(now.getTime() + 7 * 86400000);
}

/** 1–5: which Friday/Wednesday of the month this date is in America/New_York. */
export function easternWeekOfMonth(when: Date): number {
  const day = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", day: "numeric" }).format(when)
  );
  return Math.ceil(day / 7);
}

/** `nth:3` or `nth:2,4` in notes. Empty = every week. */
export function parseMonthWeeks(notes: string): number[] {
  const raw = (notes.match(/nth:([0-9,-]+)/i) || [])[1] || "";
  return raw
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => n >= 1 && n <= 5);
}

export function encodeMonthWeeks(weeks: number[]): string {
  const clean = weeks.filter((n) => n >= 1 && n <= 5);
  return clean.length ? `nth:${clean.join(",")}` : "";
}

export function monthWeeksLabel(weeks: number[]): string {
  if (!weeks.length) return "every week";
  const names = ["", "first", "second", "third", "fourth", "fifth"];
  return weeks.map((w) => names[w] || String(w)).join(" and ") + " of the month";
}

export function shouldRunThisWeek(notes: string, when: Date): boolean {
  const weeks = parseMonthWeeks(notes);
  if (!weeks.length) return true;
  return weeks.includes(easternWeekOfMonth(when));
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
