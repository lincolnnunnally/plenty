import { mapsDirUrl } from "@/lib/maps";
import { planIdsFromNotes } from "@/lib/plan";
import { plentyOrigin } from "@/lib/public-url";
import type { Household } from "@/lib/db/queries";

const ALERT = /\[alerts:places\]/i;

export function wantsPlaceAlerts(notes: string | null | undefined) {
  return ALERT.test(notes || "");
}

export function withPlaceAlerts(notes: string, on: boolean) {
  const base = (notes || "").replace(ALERT, "").replace(/\s{2,}/g, " ").trim();
  return on ? `${base} [alerts:places]`.trim() : base;
}

export function followsPlace(household: Pick<Household, "notes">, placeId: string) {
  const ids = planIdsFromNotes(household.notes || "");
  return ids.includes(placeId) || (placeId === "hub" && ids.includes("hub"));
}

export function zip5(value: string | null | undefined) {
  const d = String(value || "").replace(/\D/g, "");
  return d.length >= 5 ? d.slice(0, 5) : "";
}

export function zipsFrom(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.map((v) => String(v)) : String(value ?? "").split(/[,\s]+/);
  return [...new Set(raw.map(zip5).filter(Boolean))];
}

export type InviteMatch = {
  zips?: string[];
  ids?: string[];
  children?: boolean;
  delivery?: boolean;
  neverVisited?: boolean;
  quietDays?: number;
  minSize?: number;
  followersOnly?: boolean;
  placeId?: string;
};

export function matchesInvite(
  household: Household,
  match: InviteMatch,
  visits?: Map<string, { count: number; lastVisit: string | null }>
) {
  if (match.zips && match.zips.length) {
    if (!match.zips.includes(zip5(household.zip))) return false;
  }
  if (match.ids && match.ids.length && !match.ids.includes(household.id)) return false;
  if (match.children && household.children_count < 1) return false;
  if (match.delivery && !household.delivery_ok) return false;
  if (match.minSize && household.household_size < match.minSize) return false;
  if (match.followersOnly && match.placeId && !followsPlace(household, match.placeId)) return false;
  const v = visits?.get(household.id);
  if (match.neverVisited && (v?.count || 0) > 0) return false;
  if (match.quietDays && match.quietDays > 0) {
    const last = v?.lastVisit ? new Date(v.lastVisit).getTime() : 0;
    const cutoff = Date.now() - match.quietDays * 86400000;
    if (last && last > cutoff) return false;
  }
  return true;
}

export function canReach(household: Pick<Household, "reach_ok" | "phone" | "email">) {
  return Boolean(household.reach_ok && (household.phone || household.email));
}

export function inviteCopy(input: {
  name: string;
  hours?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  food?: string[];
  kind: "invite" | "hours" | "new_place" | "this_week";
}) {
  const origin = plentyOrigin();
  const drive = mapsDirUrl({
    address: input.address,
    city: input.city,
    state: input.state,
    zip: input.zip
  });
  const food = (input.food || []).filter(Boolean).slice(0, 6).join(", ");
  const hours = input.hours || "Hours on the door.";
  if (input.kind === "this_week") {
    return {
      subject: `This week at ${input.name}`,
      text: `${input.name}${input.hours ? ` · ${input.hours}` : ""}\nThis week: ${food || "see the list when you arrive"}.\nFood is free.\n${origin}/this-week${drive ? `\nDrive: ${drive}` : ""}`
    };
  }
  if (input.kind === "hours") {
    return {
      subject: `${input.name} hours`,
      text: `${input.name} hours: ${hours}\nYou are invited. Food is free.\n${origin}/around${drive ? `\nDrive: ${drive}` : ""}`
    };
  }
  if (input.kind === "new_place") {
    return {
      subject: `New pantry: ${input.name}`,
      text: `${input.name} is on the list.\n${hours}\nYou are invited. Food is free.\n${origin}/around${drive ? `\nDrive: ${drive}` : ""}`
    };
  }
  return {
    subject: `Invite: ${input.name}`,
    text: `You are invited to ${input.name}.\n${hours}${food ? `\nThis week: ${food}` : ""}\nFood is free.\n${origin}/around${drive ? `\nDrive: ${drive}` : ""}`
  };
}
