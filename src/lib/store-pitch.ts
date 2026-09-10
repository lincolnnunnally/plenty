export const STORE_PITCH = [
  {
    kicker: "Tax",
    title: "A deduction the dumpster cannot give you",
    line: "Federal law (IRC §170(e)(3)): cost plus half the unsold profit — often more than throwing it away. Ask your accountant. Not tax advice."
  },
  {
    kicker: "Law",
    title: "Federal and Georgia law both cover you",
    line: "Bill Emerson Act (42 U.S.C. § 1791) and O.C.G.A. § 51-1-31. Recipients sign a waiver. Gross negligence is the exception — not ordinary donation."
  },
  {
    kicker: "Sales",
    title: "Your register does not go with the food",
    line: "Pantry families still buy what we cannot give. Research finds no significant drop in grocer revenue when a pantry is nearby."
  },
  {
    kicker: "Ops",
    title: "Fresher shelves. Less hauling.",
    line: "Pull aging food, donate it, restock. Stores that do this have been shown to earn higher markups — and stop paying to haul waste."
  }
] as const;

export const WEEKDAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" }
] as const;

export const FOOD_TYPES = [
  { value: "dry", label: "Dry / canned" },
  { value: "produce", label: "Produce" },
  { value: "refrigerated", label: "Cold" },
  { value: "frozen", label: "Frozen" }
] as const;

const FOOD_SET: Set<string> = new Set(FOOD_TYPES.map((t) => t.value));

export function foodTypesFrom(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.map((v) => String(v))
    : String(value ?? "").split(/[,\s]+/);
  return [...new Set(raw.map((s) => s.trim().toLowerCase()).filter((s) => FOOD_SET.has(s)))];
}

export function encodeFoodNote(types: string[]): string {
  const t = types.length ? types : ["dry"];
  return `food:${t.join(",")}`;
}

export function parseFoodNote(notes: string): string[] {
  const match = String(notes || "").match(/food:([a-z,]+)/i);
  if (!match) return ["dry"];
  const parsed = foodTypesFrom(match[1]);
  return parsed.length ? parsed : ["dry"];
}

export function itemsForRecurringPickup(types: string[], pickupAt: Date) {
  const cats = types.length ? types : ["dry"];
  const labels: Record<string, string> = {
    dry: "Dry / canned",
    produce: "Produce",
    refrigerated: "Cold",
    frozen: "Frozen"
  };
  return cats.map((category) => {
    let mustUseBy: string | null = null;
    if (category === "produce") mustUseBy = new Date(pickupAt.getTime() + 24 * 3600000).toISOString();
    if (category === "refrigerated") mustUseBy = new Date(pickupAt.getTime() + 48 * 3600000).toISOString();
    return {
      category,
      title: labels[category] || category,
      quantity: "see store",
      mustUseBy
    };
  });
}

export function weekdayName(n: number) {
  return WEEKDAYS.find((d) => Number(d.value) === n)?.label || "that day";
}

export function normalizeTimeLocal(value: string) {
  const m = String(value || "").trim().match(/^(\d{2}:\d{2})/);
  return m ? m[1] : "";
}
