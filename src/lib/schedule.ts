const DAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function hourNorm(h: number) {
  return h === 24 ? 0 : h;
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

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
