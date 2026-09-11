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

export function visitTally(
  visits: { location_id?: string | null; visited_at: string }[],
  hubId: string
) {
  const rows = new Map<string, { count: number; last: string }>();
  for (const v of visits) {
    const id = !v.location_id || v.location_id === hubId ? "hub" : v.location_id;
    const cur = rows.get(id) || { count: 0, last: v.visited_at };
    cur.count += 1;
    if (v.visited_at > cur.last) cur.last = v.visited_at;
    rows.set(id, cur);
  }
  return rows;
}
