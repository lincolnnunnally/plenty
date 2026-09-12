import { fail, ok, readJson, str, requireDeskPantry } from "@/lib/api";
import { addStorePerson, listStorePartners } from "@/lib/db/queries";
import { COVERAGE, DEPARTMENTS } from "@/lib/store-people";

export const dynamic = "force-dynamic";

const DEPTS = DEPARTMENTS.map((d) => d.value) as string[];
const COVER = COVERAGE.map((c) => c.value) as string[];

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const partnerId = str(body.partnerId);
  const partners = await listStorePartners(pantry.id);
  if (!partners.some((p) => p.id === partnerId)) return fail("Pick a store.");
  const department = str(body.department) || "other";
  if (!DEPTS.includes(department)) return fail("Choose a department.");
  const coverage = str(body.coverage) || "none";
  if (!COVER.includes(coverage)) return fail("Say how much of this department we get.");
  const name = str(body.name);
  const role = str(body.role);
  if (!name && !role && !str(body.phone)) return fail("Leave a name, a role, or a phone.");
  try {
    const person = await addStorePerson({
      pantryId: pantry.id,
      partnerId,
      name,
      role,
      department,
      phone: str(body.phone),
      email: str(body.email),
      coverage,
      throwing: str(body.throwing),
      concern: str(body.concern),
      status: str(body.status) || "talking",
      notes: str(body.notes)
    });
    return ok({ personId: person.id, message: "Saved. This person is on the donor desk." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save that person.", 503);
  }
}
