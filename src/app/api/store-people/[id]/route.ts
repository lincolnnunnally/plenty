import { fail, ok, readJson, str, requireDeskPantry } from "@/lib/api";
import { updateStorePerson } from "@/lib/db/queries";
import { COVERAGE, DEPARTMENTS } from "@/lib/store-people";

export const dynamic = "force-dynamic";

const DEPTS = DEPARTMENTS.map((d) => d.value) as string[];
const COVER = COVERAGE.map((c) => c.value) as string[];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const { id } = await params;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const department = str(body.department);
  if (department && !DEPTS.includes(department)) return fail("Choose a department.");
  const coverage = str(body.coverage);
  if (coverage && !COVER.includes(coverage)) return fail("Say how much of this department we get.");
  const status = str(body.status);
  try {
    const person = await updateStorePerson(id, desk.pantry.id, {
      name: str(body.name) || undefined,
      role: str(body.role) || undefined,
      department: department || undefined,
      phone: str(body.phone) || undefined,
      email: str(body.email) || undefined,
      coverage: coverage || undefined,
      throwing: str(body.throwing) || undefined,
      concern: str(body.concern) || undefined,
      status: status || undefined,
      notes: str(body.notes) || undefined,
      lastTalkedAt: new Date().toISOString()
    });
    if (!person) return fail("That person was not found.", 404);
    return ok({ message: "Updated." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update that person.", 503);
  }
}
