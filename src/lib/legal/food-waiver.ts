export const FOOD_WAIVER_VERSION = "2026-09-10";

export const FOOD_WAIVER_TITLE = "Food responsibility agreement";

/** Plain-language agreement recipients sign before taking food. Not a substitute for the Emerson Act. */
export const FOOD_WAIVER_PARAGRAPHS = [
  "Plenty is a food pantry. Grocery stores, warehouses, farms, churches, and neighbors give food so it can feed a household instead of going in the trash. You are choosing to receive that food.",
  "Some donated food is close to a “best by,” “sell by,” or “use by” date, or it may not look like it would on a grocery shelf — a banana with spots, bread from yesterday’s bakery, a dented can that is still sealed. Date labels are often about peak quality, not a hard safety deadline. You decide whether to take an item, how to store it, how to cook it, and whether to eat it.",
  "You agree that you take the food as-is. You are responsible for your household’s use of the food. You will not hold Plenty, United Under God, pantry volunteers, or the stores, warehouses, farms, and people who donated the food responsible if someone in your household gets sick or is harmed after eating it, except where the law does not allow that kind of release (including gross negligence or intentional misconduct).",
  "Federal law already protects good-faith food donors and the pantry that gives the food out. This agreement is an extra record that you understood the nature of donated food and chose to receive it. It is not legal advice.",
  "The food is free. We request a donation for handling and orchestration — pickup, routing, and running the line — not for the groceries. If you cannot help with handling, you are still welcome and you still get food."
] as const;

export function foodWaiverPlainText() {
  return `${FOOD_WAIVER_TITLE} (version ${FOOD_WAIVER_VERSION})\n\n${FOOD_WAIVER_PARAGRAPHS.join("\n\n")}`;
}
