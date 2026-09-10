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

export const STORE_CONCERNS = [
  {
    value: "sick",
    title: "If someone gets sick",
    line: "Federal Bill Emerson Act and Georgia O.C.G.A. § 51-1-31 cover good-faith donors. Recipients sign a waiver. Gross negligence is the exception — not ordinary leftover food."
  },
  {
    value: "corporate",
    title: "Corporate has to say yes",
    line: "Leave the one-pager. We wait. No one stands at your dock until you say so."
  },
  {
    value: "time",
    title: "Staff do not have time",
    line: "We come to the dock. You do not sort, bag, or drive. Name a day. We take what is coming off the shelf."
  },
  {
    value: "sales",
    title: "It will hurt the register",
    line: "Pantry families still buy what we cannot give. Studies do not show a drop in grocer sales when a pantry is nearby."
  },
  {
    value: "who",
    title: "Who shows up at the dock",
    line: "Named volunteers. We text them the time. You can require a name at the door. Extra purchase is never required."
  },
  {
    value: "stop",
    title: "We might need to stop",
    line: "You pause any week. One call. The repeating pickup turns off."
  },
  {
    value: "receipt",
    title: "We need a receipt",
    line: "We email a receipt for the load. EIN 81-3554390. Show it to your accountant. Not tax advice."
  },
  {
    value: "cold",
    title: "This is cold or frozen",
    line: "Say so. We send a truck with a cooler, or we only take dry until we have one."
  }
] as const;

export function concernsFrom(value: unknown): string[] {
  const allowed = new Set<string>(STORE_CONCERNS.map((c) => c.value));
  const raw = Array.isArray(value) ? value.map((v) => String(v)) : String(value ?? "").split(/[,\s]+/);
  return [...new Set(raw.map((s) => s.trim().toLowerCase()).filter((s) => allowed.has(s)))];
}

export function encodeConcerns(value: unknown): string {
  const c = concernsFrom(value);
  return c.length ? `concerns:${c.join(",")}` : "";
}

export function parseConcerns(notes: string): string[] {
  const match = String(notes || "").match(/concerns:([a-z,]+)/i);
  return match ? concernsFrom(match[1]) : [];
}

export function concernLabels(values: string[]) {
  return STORE_CONCERNS.filter((c) => values.includes(c.value)).map((c) => c.title);
}

export function weekdayName(n: number) {
  return WEEKDAYS.find((d) => Number(d.value) === n)?.label || "that day";
}

export function normalizeTimeLocal(value: string) {
  const m = String(value || "").trim().match(/^(\d{2}:\d{2})/);
  return m ? m[1] : "";
}
