/** Same address as OWNER_ATTENTION_EMAIL. Kept here so tests can load this file without path aliases. */
export const PICKUP_FALLBACK_EMAIL = "lincoln@unitedundergod.org";

export const PICKUP_ROUTE_KINDS = ["any", "donation_pickup", "household_delivery", "store_collect", "food_drive"] as const;
export const PICKUP_WEEKDAYS = ["any", "0", "1", "2", "3", "4", "5", "6"] as const;

const DAY: Record<string, string> = { Sun: "0", Mon: "1", Tue: "2", Wed: "3", Thu: "4", Fri: "5", Sat: "6" };

export const WEEKDAY_LABELS: Record<string, string> = {
  any: "Any day",
  "0": "Sunday",
  "1": "Monday",
  "2": "Tuesday",
  "3": "Wednesday",
  "4": "Thursday",
  "5": "Friday",
  "6": "Saturday"
};

export const PICKUP_KIND_LABELS: Record<string, string> = {
  any: "Any pickup",
  donation_pickup: "Donor pickup",
  household_delivery: "Home delivery",
  store_collect: "Grocery rescue",
  food_drive: "Food drive"
};

export type PickupRouteMatch = {
  kind: string;
  weekday: string;
  email: string;
  label?: string;
};

export type NoticeKind = "new" | "24h" | "morning" | "overdue";

export function easternWeekday(iso: string | null): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" }).format(at);
  return DAY[name] || null;
}

export function cleanRouteEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!email.includes("@") || /[\s;,]/.test(email)) return "";
  return email;
}

export function matchingRouteEmails(
  routes: PickupRouteMatch[],
  input: { kind: string; scheduledFor?: string | null; weekday?: string | null }
): string[] {
  const day = input.weekday || easternWeekday(input.scheduledFor || null);
  const kind = input.kind.trim().toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const route of routes) {
    const routeKind = route.kind.trim().toLowerCase();
    const routeDay = route.weekday.trim().toLowerCase();
    if (routeKind !== "any" && routeKind !== kind) continue;
    if (routeDay !== "any" && routeDay !== day) continue;
    const email = cleanRouteEmail(route.email);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

export function planNoticeRecipients(notice: NoticeKind, routed: string[]): { to: string[]; cc: string[] } {
  const lincoln = PICKUP_FALLBACK_EMAIL;
  const people = [...new Set(routed.map(cleanRouteEmail).filter(Boolean))];
  if (notice === "overdue") return { to: [lincoln], cc: [] };
  if (notice === "new") {
    return { to: [...new Set([lincoln, ...people])], cc: [] };
  }
  const others = people.filter((email) => email !== lincoln);
  if (!others.length) return { to: [lincoln], cc: [] };
  if (people.includes(lincoln)) return { to: people, cc: [] };
  return { to: others, cc: [lincoln] };
}

export function pickupFromLine(input: { kind: string; address: string }, pantry: { name: string; address: string }) {
  if (input.kind === "household_delivery") {
    return [pantry.name, pantry.address].filter(Boolean).join(" · ") || "The pantry";
  }
  return input.address || "Address not set";
}

export function pickupDeliverLine(
  input: { kind: string; address: string; dest_note?: string },
  names: { ally?: string; location?: string; pantry: string }
) {
  if (input.kind === "household_delivery") return input.address || "Household address not set";
  return names.ally || names.location || input.dest_note || names.pantry || "The pantry";
}

export async function runPlannedSend(input: {
  notice: NoticeKind;
  routed: string[];
  subject: string;
  text: string;
  send: (args: { to: string[]; cc: string[]; subject: string; text: string }) => Promise<{ ok: boolean; error: string; id: string }>;
  log: (row: { to: string; status: "accepted" | "failed"; providerId: string; error: string; kind: NoticeKind }) => Promise<void>;
}): Promise<{ ok: boolean; to: string[]; cc: string[] }> {
  const plan = planNoticeRecipients(input.notice, input.routed);
  let result = { ok: false, error: "not sent", id: "" };
  try {
    result = await input.send({ to: plan.to, cc: plan.cc, subject: input.subject, text: input.text });
  } catch (err) {
    result = { ok: false, error: err instanceof Error ? err.message : "send failed", id: "" };
  }
  const status = result.ok ? "accepted" : "failed";
  for (const to of [...plan.to, ...plan.cc]) {
    try {
      await input.log({ to, status, providerId: result.id, error: result.ok ? "" : result.error, kind: input.notice });
    } catch {
      /* A missing log table must not block the send. */
    }
  }
  const lincolnReached = result.ok && [...plan.to, ...plan.cc].includes(PICKUP_FALLBACK_EMAIL);
  return { ok: lincolnReached, to: plan.to, cc: plan.cc };
}
