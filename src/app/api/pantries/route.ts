import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { addMembership, getDefaultPantry, isSteward, upsertPantry } from "@/lib/db/queries";
import { isSuperAdminEmail } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const existing = await getDefaultPantry();
  if (existing) {
    const allowed = await isSteward(existing.id, user.id, user.email);
    if (!allowed) return fail("Only a pantry admin can change pantry setup.", 403);
  } else if (!isSuperAdminEmail(user.email)) {
    return fail("Ask the super admin to open the first pantry.", 403);
  }
  const name = str(body.name);
  if (!name) return fail("Name the pantry.");
  const slug = slugify(str(body.slug) || name);
  try {
    const pantry = await upsertPantry(existing?.id ?? null, {
      name,
      slug,
      city: str(body.city) || "Vidalia",
      state: str(body.state) || "GA",
      zip: str(body.zip),
      address: str(body.address),
      hours_text: str(body.hoursText),
      about: str(body.about),
      phone: str(body.phone),
      email: str(body.email),
      visit_style: str(body.visitStyle) || "walk_in",
      status: str(body.status) || (str(body.hoursText) && str(body.address) ? "open" : "setup"),
      created_by: user.id
    });
    await addMembership(pantry.id, user.id, "steward");
    return ok({ pantryId: pantry.id, slug: pantry.slug, message: "Pantry saved. Hours stay blank until they are real." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the pantry.", 503);
  }
}
