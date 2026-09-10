export const VOLUNTEER_WAIVER_VERSION = "vol-2026-09-10";

export const VOLUNTEER_WAIVER_TITLE = "Volunteer agreement";

export const VOLUNTEER_WAIVER_PARAGRAPHS = [
  "You are choosing to volunteer with Plenty, a program of United Under God, Inc. Shifts include pickup at stores, setup, serving the line, and delivery.",
  "Some food is heavy, cold, or close to a date. You will lift only what you can. You will use a cooler or freezer when the load is frozen or refrigerated, or you will say you cannot take that run.",
  "You agree you volunteer as-is. You will not hold Plenty, United Under God, stores, or households responsible for ordinary accidents, except where the law does not allow that kind of release (including gross negligence or intentional misconduct).",
  "Photos of the line or a door sign may be used to tell people when a pantry is open. Do not photograph a neighbor’s face without asking.",
  "This is not a background check and not a job. Food for households is never gated on this form."
] as const;

export function volunteerWaiverPlainText() {
  return `${VOLUNTEER_WAIVER_TITLE} (version ${VOLUNTEER_WAIVER_VERSION})\n\n${VOLUNTEER_WAIVER_PARAGRAPHS.join("\n\n")}`;
}
