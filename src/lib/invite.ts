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
