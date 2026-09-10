/** Food donors to meet. Public facts only. Do not invent a pickup day. */

export type FoodDonorStart = {
  names: string[];
  kind: "warehouse" | "grocery" | "farm" | "manufacturer" | "church";
  name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  website: string;
  contactName: string;
  contactRole: string;
  gives: Array<"dry" | "frozen" | "refrigerated" | "produce">;
  notes: string;
};

export const FOOD_DONOR_STARTING: FoodDonorStart[] = [
  {
    names: ["Dot Foods", "Dot Foods — Vidalia distribution center", "DOT Foods"],
    kind: "warehouse",
    name: "Dot Foods",
    address: "1120 West North Street",
    city: "Vidalia",
    zip: "30474",
    phone: "",
    website: "https://www.dotfoods.com",
    contactName: "Wendy Nolen",
    contactRole: "HR manager; heads the Charitable Giving Committee (The Advance, 16 Apr 2025)",
    gives: ["frozen", "dry", "refrigerated"],
    notes:
      "Vidalia distribution center of the largest U.S. food redistributor. Handles dry, frozen, and refrigerated. Public: they donate $6,000–$7,000 or more in food every week to local food banks (The Advance, 16 Apr 2025). Neighbor to Neighbor pantry program. Lincoln: they have given frozen foods and dried goods to Vidalia Church of God for that pantry. Meet first. Do not invent a pickup day."
  }
];

export function donorNameKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function encodeDonorMeta(input: { kind: string; gives: string[]; next?: string }) {
  const parts = [`kind:${input.kind}`];
  if (input.gives.length) parts.push(`gives:${input.gives.join(",")}`);
  if (input.next) parts.push(`next:${input.next}`);
  return parts.join(" ");
}

export function parseDonorMeta(notes: string) {
  const first = (notes.split("\n")[0] || "").trim();
  const kind = (first.match(/kind:([a-z_]+)/i) || [])[1] || "";
  const gives = ((first.match(/gives:([a-z,]+)/i) || [])[1] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const next = (first.match(/next:([0-9T:.-]+)/i) || [])[1] || "";
  const body = notes.startsWith("kind:") ? notes.split("\n").slice(1).join("\n").trim() : notes;
  return { kind, gives, next, body };
}

export function donorKindLabel(kind: string) {
  if (kind === "warehouse") return "Warehouse";
  if (kind === "farm") return "Farm";
  if (kind === "manufacturer") return "Manufacturer";
  if (kind === "church") return "Church";
  if (kind === "grocery") return "Grocery";
  return kind || "Food donor";
}

export const DONOR_ACTIVITY_KINDS = ["donor_call", "donor_visit", "donor_gift", "donor_note", "donor_email"] as const;
export type DonorActivityKind = (typeof DONOR_ACTIVITY_KINDS)[number];

export function isDonorActivity(kind: string) {
  return kind.startsWith("donor_");
}

export function activityLabel(kind: string) {
  if (kind === "donor_call") return "Call";
  if (kind === "donor_visit") return "Visit";
  if (kind === "donor_gift") return "Gift";
  if (kind === "donor_email") return "Email";
  return "Note";
}
