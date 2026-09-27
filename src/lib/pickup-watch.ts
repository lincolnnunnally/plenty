import { DEFAULT_PICKUP_TIMEZONE, validTimeZone } from "./schedule.ts";

export const PICKUP_CLOSED = new Set(["done", "completed", "cancelled", "canceled"]);

export type PickupTiming = {
  status: string;
  scheduled_for: string | null;
  assigned_user_id?: string | null;
};

export type ReminderKind = "24h" | "morning" | "overdue";

export type ReminderRow = PickupTiming & {
  id: string;
  pantry_id?: string;
  kind: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  notes: string;
  window_text: string;
  reminder_24h_at: string | null;
  reminder_morning_at: string | null;
  overdue_alert_at: string | null;
  time_zone?: string | null;
};

export function pickupIsClosed(status: string) {
  return PICKUP_CLOSED.has(status.trim().toLowerCase());
}

export function pickupIsOverdue(row: PickupTiming, now: Date) {
  if (pickupIsClosed(row.status) || !row.scheduled_for) return false;
  const at = new Date(row.scheduled_for).getTime();
  return Number.isFinite(at) && at < now.getTime();
}

/** No confirmed clock time, or the row is still marked needs_scheduling. A window phrase alone still needs a date. */
export function pickupNeedsScheduling(row: PickupTiming) {
  if (pickupIsClosed(row.status)) return false;
  if (row.status.trim().toLowerCase() === "needs_scheduling") return true;
  return !row.scheduled_for;
}

export function groupPickups<T extends PickupTiming>(rows: T[], now = new Date()) {
  const byTime = (a: T, b: T) => new Date(a.scheduled_for || 0).getTime() - new Date(b.scheduled_for || 0).getTime();
  return {
    needsScheduling: rows.filter((row) => pickupNeedsScheduling(row)),
    upcoming: rows.filter((row) => !pickupIsClosed(row.status) && !pickupNeedsScheduling(row) && row.scheduled_for && !pickupIsOverdue(row, now)).sort(byTime),
    overdue: rows.filter((row) => pickupIsOverdue(row, now) && !pickupNeedsScheduling(row)).sort(byTime),
    finished: rows.filter((row) => pickupIsClosed(row.status))
  };
}

export function sortUpcoming<T extends PickupTiming>(rows: T[], now = new Date()): T[] {
  const groups = groupPickups(rows, now);
  return [...groups.needsScheduling, ...groups.upcoming, ...groups.overdue, ...groups.finished];
}

function zoneClock(when: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false
  }).formatToParts(when);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const hour = Number(get("hour"));
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: hour === 24 ? 0 : hour };
}

function zoneOf(timeZone?: string | null) {
  return validTimeZone(timeZone) || DEFAULT_PICKUP_TIMEZONE;
}

/** True once it is 7 AM in the pickup zone on the pickup's calendar day, and the pickup is still ahead. */
export function isPickupMorning(scheduledFor: string, now: Date, timeZone?: string | null) {
  const zone = zoneOf(timeZone);
  const at = new Date(scheduledFor);
  if (Number.isNaN(at.getTime()) || at.getTime() <= now.getTime()) return false;
  const pickup = zoneClock(at, zone);
  const current = zoneClock(now, zone);
  return pickup.date === current.date && current.hour >= 7;
}

export function formatEasternWhen(iso: string | null, windowText = "", timeZone?: string | null) {
  const window = windowText.replace(/[\r\n]+/g, " ").trim();
  if (!iso) return window || "time not set";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return window || "time not set";
  const stamp = at.toLocaleString("en-US", {
    timeZone: zoneOf(timeZone),
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  });
  return window ? `${stamp} · window ${window}` : stamp;
}

function oneLine(value: string, fallback: string) {
  const clean = value.replace(/[\r\n]+/g, " ").trim();
  return clean || fallback;
}

export function composePickupAttention(input: {
  org: string;
  contactName: string;
  contactPhone: string;
  address: string;
  whenIso: string | null;
  windowText?: string;
  what: string;
  reviewUrl: string;
  headline?: string;
  timeZone?: string | null;
}) {
  const who = oneLine(input.org || input.contactName, "someone");
  const subject = input.headline || `Pickup needs someone to show up: ${who}`;
  const text = [
    `When: ${formatEasternWhen(input.whenIso, input.windowText || "", input.timeZone)}`,
    `Where: ${oneLine(input.address, "not given")}`,
    `What: ${oneLine(input.what, "not given")}`,
    `Org: ${oneLine(input.org, "not given")}`,
    `Contact: ${oneLine(input.contactName, "not given")} ${oneLine(input.contactPhone, "")}`.trim(),
    `Review: ${input.reviewUrl}`
  ].join("\n");
  return { subject, text };
}

export function dueReminders(row: ReminderRow, now: Date): ReminderKind[] {
  if (pickupIsClosed(row.status) || !row.scheduled_for) return [];
  const at = new Date(row.scheduled_for).getTime();
  if (!Number.isFinite(at)) return [];
  const ms = at - now.getTime();
  if (ms <= 0) return row.overdue_alert_at ? [] : ["overdue"];
  const due: ReminderKind[] = [];
  if (ms <= 24 * 3600000 && !row.reminder_24h_at) due.push("24h");
  if (isPickupMorning(row.scheduled_for, now, row.time_zone) && !row.reminder_morning_at) due.push("morning");
  return due;
}

export function composeReminder(row: ReminderRow, kind: ReminderKind, reviewUrl: string) {
  const org = row.contact_name || row.address || "a pickup";
  const headline =
    kind === "overdue"
      ? `Pickup time passed and it is not finished: ${oneLine(org, "a pickup")}`
      : kind === "morning"
        ? `Pickup today: ${oneLine(org, "a pickup")}`
        : `Pickup in about 24 hours: ${oneLine(org, "a pickup")}`;
  return composePickupAttention({
    org: row.contact_name,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    address: row.address,
    whenIso: row.scheduled_for,
    windowText: row.window_text,
    what: row.notes || row.kind,
    reviewUrl,
    headline,
    timeZone: row.time_zone
  });
}

export async function runPickupWatch(input: {
  rows: ReminderRow[];
  now: Date;
  reviewUrl: string;
  deliver: (notice: { subject: string; text: string }, row: ReminderRow, kind: ReminderKind) => Promise<{ ok: boolean }>;
  mark: (id: string, kind: ReminderKind) => Promise<void>;
}): Promise<{ sent: ReminderKind[]; failed: number }> {
  const sent: ReminderKind[] = [];
  let failed = 0;
  for (const row of input.rows) {
    for (const kind of dueReminders(row, input.now)) {
      try {
        const result = await input.deliver(composeReminder(row, kind, input.reviewUrl), row, kind);
        if (!result.ok) {
          failed += 1;
          continue;
        }
        await input.mark(row.id, kind);
        sent.push(kind);
      } catch {
        failed += 1;
      }
    }
  }
  return { sent, failed };
}
