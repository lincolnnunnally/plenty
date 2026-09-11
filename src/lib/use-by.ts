const LINE = /useby:(\d{4}-\d{2}-\d{2})/i;

export function useByFromNotes(notes: string | null | undefined) {
  const match = (notes || "").match(LINE);
  return match ? match[1] : "";
}

export function notesWithoutUseBy(notes: string) {
  return notes.replace(LINE, "").replace(/\s{2,}/g, " ").trim();
}

export function withUseBy(notes: string, date: string) {
  const rest = notesWithoutUseBy(notes);
  const day = String(date || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return rest;
  return `useby:${day}${rest ? ` ${rest}` : ""}`;
}

export function daysLeft(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const then = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(then)) return null;
  return Math.round((then - today) / 86400000);
}

export function useByLabel(date: string) {
  const d = daysLeft(date);
  if (d == null) return "";
  if (d < 0) return "Use first — date passed";
  if (d === 0) return "Use today";
  if (d === 1) return "Use tomorrow";
  if (d <= 3) return `Use in ${d} days`;
  return `Use by ${date}`;
}

export function sortForUse<T extends { notes?: string; quantity?: number; category?: string; name?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const da = daysLeft(useByFromNotes(a.notes)) ?? 9999;
    const db = daysLeft(useByFromNotes(b.notes)) ?? 9999;
    if (da !== db) return da - db;
    const spoil = (c: string) => (c === "produce" ? 0 : c === "dairy" || c === "protein" ? 1 : 2);
    const sa = spoil(a.category || "");
    const sb = spoil(b.category || "");
    if (sa !== sb) return sa - sb;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export function giveFirst<T extends { notes?: string; quantity?: number }>(items: T[]) {
  return sortForUse(items).filter((i) => {
    const qty = Number(i.quantity || 0);
    if (qty <= 0) return false;
    const d = daysLeft(useByFromNotes(i.notes));
    return d != null && d <= 3;
  });
}
