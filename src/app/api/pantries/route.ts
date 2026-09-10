import { fail, ok, readJson, requireStewardFor, requireUser, resolvePantry, str } from "@/lib/api";
import { addMembership, getAlly, getDefaultPantry, getPantryBySlug, isSteward, updateAlly, upsertPantry } from "@/lib/db/queries";
import { isSuperAdminEmail } from "@/lib/auth/roles";
import { pantryLineUrl, pantryPublicUrl } from "@/lib/public-url";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function on(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "yes" || value === "1";
}

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");

  if (str(body.givingMode)) {
    const pantry = await resolvePantry(body);
    if (!pantry) return fail("No pantry is set up yet.", 503);
    const steward = await requireStewardFor(pantry.id);
    if (steward.error) return steward.error;
    const mode = str(body.givingMode) === "uug" ? "uug" : "own";
    await upsertPantry(pantry.id, { ...pantry, giving_mode: mode });
    return ok({
      message:
        mode === "uug"
          ? "This pantry now uses United Under God Cash App, Venmo, Zelle, and card."
          : "This pantry will show its own Cash App, Venmo, and Zelle once you post the real handles."
    });
  }

  if (str(body.openFromAlly)) {
    if (!isSuperAdminEmail(user.email)) return fail("Only the super admin can open a desk for another pantry.", 403);
    const home = await getDefaultPantry();
    if (!home) return fail("Plenty is not set up yet.", 503);
    const ally = await getAlly(str(body.openFromAlly), home.id);
    if (!ally) return fail("Meet that pantry first.");
    try {
      const slug = slugify(ally.name);
      const taken = await getPantryBySlug(slug);
      const pantry = taken && taken.id === ally.operator_pantry_id
        ? taken
        : await upsertPantry(ally.operator_pantry_id, {
            name: ally.name,
            slug: taken && taken.id !== ally.operator_pantry_id ? `${slug}-${ally.id.slice(0, 6)}` : slug,
            city: ally.city || "Vidalia",
            state: ally.state || "GA",
            zip: ally.zip,
            address: ally.address,
            hours_text: ally.hours_text,
            phone: ally.phone,
            email: ally.contact_email,
            giving_mode: "uug",
            status: "setup",
            created_by: user.id
          });
      await updateAlly(ally.id, home.id, { operatorPantryId: pantry.id });
      const stewardId = str(body.userId);
      if (stewardId) await addMembership(pantry.id, stewardId, "steward");
      await addMembership(pantry.id, user.id, "steward");
      return ok({
        pantryId: pantry.id,
        slug: pantry.slug,
        message: `${pantry.name} can run on Plenty. Line QR: ${pantryLineUrl(pantry.slug)}. They use United Under God giving until they post their own handles.`
      });
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Could not open that pantry desk.", 503);
    }
  }

  const createNew = on(body.createNew);
  const existing = createNew ? null : await resolvePantry(body);
  if (existing) {
    const allowed = await isSteward(existing.id, user.id, user.email);
    if (!allowed) return fail("Only a pantry admin can change pantry setup.", 403);
  } else if (!isSuperAdminEmail(user.email)) {
    return fail("Ask the super admin to open a pantry desk.", 403);
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
      receive_rules: str(body.receiveRules),
      donation_policy: str(body.donationPolicy) || "welcome",
      donation_note: str(body.donationNote),
      residency_rules: str(body.residencyRules),
      id_required: body.idRequired === true || body.idRequired === "true" || body.idRequired === "on",
      frequency_rules: str(body.frequencyRules),
      giving_mode: str(body.givingMode) || existing?.giving_mode || (createNew ? "uug" : "own"),
      created_by: user.id
    });
    await addMembership(pantry.id, user.id, "steward");
    return ok({
      pantryId: pantry.id,
      slug: pantry.slug,
      publicUrl: pantryPublicUrl(pantry.slug),
      lineUrl: pantryLineUrl(pantry.slug),
      message: `Pantry saved. Public page: ${pantryPublicUrl(pantry.slug)}. Line: ${pantryLineUrl(pantry.slug)}.`
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the pantry.", 503);
  }
}
