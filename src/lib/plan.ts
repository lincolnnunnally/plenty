const LINE = /^plan:([a-z0-9,-]+)/im;

export function planIdsFromNotes(notes: string) {
  const match = notes.match(LINE);
  if (!match) return [];
  return [...new Set(match[1].split(",").map((s) => s.trim()).filter(Boolean))];
}

export function notesWithoutPlan(notes: string) {
  return notes.replace(LINE, "").replace(/^\n/, "").trim();
}

export function withPlanIds(notes: string, ids: string[]) {
  const rest = notesWithoutPlan(notes);
  const clean = [...new Set(ids.map((s) => s.trim()).filter(Boolean))];
  return clean.length ? `plan:${clean.join(",")}${rest ? `\n${rest}` : ""}` : rest;
}

export function planIdsFrom(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.map((v) => String(v)) : String(value ?? "").split(/[,\s]+/);
  return [...new Set(raw.map((s) => s.trim()).filter((s) => s.length > 8 || s === "hub"))];
}
