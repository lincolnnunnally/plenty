const DAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function hourNorm(h: number) {
  return h === 24 ? 0 : h;
}

/**
 * A datetime-local value is America/New_York wall time, including daylight saving.
 * A value that already carries Z or an offset is an absolute instant and is kept.
 * Returns a UTC ISO string, or null when the value is empty or not a real Eastern time.
 */
export function parseEasternDateTime(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
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
  for (const offset of ["-04:00", "-05:00"]) {
    const candidate = new Date(`${year}-${month}-${day}T${hh}:${mm}:${ss}${offset}`);
    if (Number.isNaN(candidate.getTime())) continue;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).formatToParts(candidate);
    const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
    const wallHour = hourNorm(Number(get("hour")));
    if (
      get("year") === year &&
      get("month") === month &&
      get("day") === day &&
      wallHour === hour &&
      Number(get("minute")) === minute &&
      Number(get("second")) === second
    ) {
      return candidate.toISOString();
    }
  }
  return null;
}

/** Value for an input type="datetime-local", shown as America/New_York wall time. */
export function easternLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
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
