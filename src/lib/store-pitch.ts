export const STORE_HEADLINE =
  "Throw it away, deduct the cost. Donate it, you may deduct twice as much.";
export const STORE_TITLE = STORE_HEADLINE.replace(/\.$/, "");
export const STORE_DESCRIPTION =
  "Unsold food in the dumpster is a cost write-off. Donate it to Plenty and you may deduct up to twice what you paid — then neighbors who felt that kindness come back and spend in your store.";
export const STORE_LEDE =
  "A grocery store is a business. This is the better number. Toss unsold food and you write off what you paid — then you pay to haul it. Give that same food to Plenty, a program of United Under God (a 501(c)(3)), and federal tax law may let you deduct the cost plus half the profit you would have made, up to twice the cost of the product. That is twice the financial benefit. Then people who appreciate the kindness come back. They spend the money they have left — milk, meat, soap, a birthday cake — in your store.";
export const STORE_LEDE_SHORT =
  "A grocery store is a business. Throw unsold food away and you deduct what you paid. Donate it to our 501(c)(3) and you may deduct the cost plus half the profit you would have made — up to twice the cost. Then people who felt that kindness come back and spend leftover money in your store.";
export const STORE_PROOF = "That’s why Publix, Kroger, Walmart, and Costco already do it.";
export const STORE_FINE =
  "Not legal or tax advice. Eligibility depends on the food, your entity, and your books. Show this to your accountant.";

export const STORE_TOSS = {
  title: "If you throw it away",
  items: [
    "You only deduct what you paid for it.",
    "You still pay the dumpster and the hauler.",
    "The food is gone. Nobody sees the gift."
  ]
} as const;

export const STORE_DONATE = {
  title: "If you donate it to Plenty",
  items: [
    "You may deduct up to twice the cost.",
    "We pick it up. Receipt in your hand.",
    "Neighbors remember. They come back and shop."
  ]
} as const;

export const STORE_MATH = {
  setup: "You paid $200. You would have sold it for $600.",
  toss: "Dumpster write-off ≈ $200",
  donate: "Donate write-off ≈ $400 — twice the cost",
  note: "Formula: cost plus half the profit you would have received, capped at twice what you paid."
} as const;

export const STORE_PITCH = [
  {
    kicker: "Tax",
    title: "Twice the write-off",
    line: "Throw it away: deduct cost. Donate wholesome food to our 501(c)(3): deduct the cost plus 50% of the profit you would have received — up to twice the cost of the product. Ask your accountant about IRC § 170(e)(3)."
  },
  {
    kicker: "Sales",
    title: "Kindness comes back as sales",
    line: "People who feel a store’s kindness reciprocate. They walk your aisles and often spend leftover money on other items at your store — not the one down the road."
  },
  {
    kicker: "Ops",
    title: "The dumpster charges you",
    line: "Disposal is a fee. Donation is often cheaper per pound, and it clears the shelf for food people will pay full price for."
  },
  {
    kicker: "Law",
    title: "You are covered",
    line: "Bill Emerson Act (42 U.S.C. § 1791) and O.C.G.A. § 51-1-31. Recipients sign a waiver. Gross negligence is the exception — not ordinary donation."
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
    line: "People who feel the kindness come back. They spend leftover money on other items in your store. Studies do not show a drop in grocer sales when a pantry is nearby."
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
