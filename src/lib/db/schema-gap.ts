/** True when PostgREST or Postgres says a column or table is not there yet. */
export function schemaGap(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = String(error.code || "");
  if (code === "PGRST204" || code === "PGRST205" || code === "42703" || code === "42P01") return true;
  const msg = String(error.message || "").toLowerCase();
  if (msg.includes("does not exist") || msg.includes("schema cache")) return true;
  return msg.includes("could not find the") && (msg.includes("column") || msg.includes("table"));
}
