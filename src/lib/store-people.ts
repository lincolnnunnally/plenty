export const DEPARTMENTS = [
  { value: "meat", label: "Meat" },
  { value: "dairy", label: "Dairy" },
  { value: "produce", label: "Produce" },
  { value: "bakery", label: "Bakery" },
  { value: "frozen", label: "Frozen" },
  { value: "grocery", label: "Grocery / dry" },
  { value: "store_manager", label: "Store manager" },
  { value: "other", label: "Other" }
] as const;

export const COVERAGE = [
  { value: "none", label: "We get none — they throw it" },
  { value: "some", label: "We get some — more still thrown" },
  { value: "most", label: "We get most of it" },
  { value: "all", label: "We get all of it" }
] as const;

export function departmentLabel(value: string) {
  return DEPARTMENTS.find((d) => d.value === value)?.label || value || "Department";
}

export function coverageLabel(value: string) {
  return COVERAGE.find((c) => c.value === value)?.label || value || "Unknown";
}

export function leftoverPotential(coverage: string) {
  if (coverage === "none") return "All of it still in the dumpster";
  if (coverage === "some") return "More still thrown";
  if (coverage === "most") return "A little still thrown";
  if (coverage === "all") return "Covered";
  return "";
}

const PEOPLE_MARK = "---people---";

export type StoredPerson = {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  coverage: string;
  throwing: string;
  concern: string;
  status: string;
  notes: string;
  last_talked_at: string | null;
};

export function splitDonorNotes(notes: string): { head: string; people: StoredPerson[] } {
  const raw = String(notes || "");
  const at = raw.indexOf(PEOPLE_MARK);
  if (at < 0) return { head: raw.trim(), people: [] };
  const head = raw.slice(0, at).trim();
  const blob = raw.slice(at + PEOPLE_MARK.length).trim();
  try {
    const parsed = JSON.parse(blob);
    const people = Array.isArray(parsed) ? parsed : [];
    return { head, people: people.map(asPerson) };
  } catch {
    return { head, people: [] };
  }
}

export function joinDonorNotes(head: string, people: StoredPerson[]) {
  const body = (head || "").trim();
  if (!people.length) return body;
  return `${body}\n${PEOPLE_MARK}\n${JSON.stringify(people)}`;
}

function asPerson(row: Record<string, unknown>): StoredPerson {
  return {
    id: String(row.id || crypto.randomUUID()),
    name: String(row.name || ""),
    role: String(row.role || ""),
    department: String(row.department || "other"),
    phone: String(row.phone || ""),
    email: String(row.email || ""),
    coverage: String(row.coverage || "none"),
    throwing: String(row.throwing || ""),
    concern: String(row.concern || ""),
    status: String(row.status || "talking"),
    notes: String(row.notes || ""),
    last_talked_at: row.last_talked_at ? String(row.last_talked_at) : null
  };
}

export function newPersonId() {
  return crypto.randomUUID();
}
