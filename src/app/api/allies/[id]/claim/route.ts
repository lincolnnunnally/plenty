import { fail, ok, requireUser } from "@/lib/api";
import { grantAllyOperator } from "@/lib/db/food-loads";
import { addMembership, getAlly, getDefaultPantry, getPantryBySlug, isSteward, updateAlly, upsertPantry } from "@/lib/db/queries";
import { pantryPublicUrl } from "@/lib/public-url";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const home = await getDefaultPantry();
  if (!home) return fail("Plenty is not set up yet.", 503);
  const { id } = await context.params;
  const ally = await getAlly(id, home.id);
  if (!ally) return fail("That pantry is not on the list.", 404);
  if (ally.kind !== "pantry" && ally.kind !== "church") return fail("Only a pantry can claim a desk.");

  try {
    if (ally.operator_pantry_id) {
      const allowed = await isSteward(ally.operator_pantry_id, user.id, user.email);
      if (!allowed) return fail("Someone already claimed this pantry. Ask them to add you, or write Lincoln.", 409);
      await grantAllyOperator(ally.id, user.id);
      return ok({ pantryId: ally.operator_pantry_id, message: "You already run this pantry." });
    }

    const slug = slugify(ally.name) || `pantry-${ally.id.slice(0, 6)}`;
    const taken = await getPantryBySlug(slug);
    const pantry = await upsertPantry(null, {
      name: ally.name,
      slug: taken ? `${slug}-${ally.id.slice(0, 6)}` : slug,
      city: ally.city || "Vidalia",
      state: ally.state || "GA",
      zip: ally.zip,
      address: ally.address,
      hours_text: ally.hours_text,
      phone: ally.phone,
      email: ally.contact_email,
      giving_mode: "uug",
      status: ally.hours_text ? "open" : "setup",
      created_by: user.id
    });
    await updateAlly(ally.id, home.id, { operatorPantryId: pantry.id });
    await addMembership(pantry.id, user.id, "steward");
    await grantAllyOperator(ally.id, user.id);
    return ok({
      pantryId: pantry.id,
      slug: pantry.slug,
      publicUrl: pantryPublicUrl(pantry.slug),
      message: `${pantry.name} is yours to run. Post hours, who you serve, and when you need volunteers.`
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not claim that pantry.", 503);
  }
}
