import { cookies } from "next/headers";
import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { grantAllyOperator } from "@/lib/db/food-loads";
import { addMembership, getAlly, getDefaultPantry, getPantryBySlug, isSteward, updateAlly, upsertPantry } from "@/lib/db/queries";
import { notifyDesk } from "@/lib/notify";
import { pantryPublicUrl } from "@/lib/public-url";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function nameKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

async function setDesk(pantryId: string) {
  const jar = await cookies();
  jar.set("plenty_desk", pantryId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const home = await getDefaultPantry();
  if (!home) return fail("Plenty is not set up yet.", 503);
  const { id } = await context.params;
  const ally = await getAlly(id, home.id);
  if (!ally) return fail("That pantry is not on the list.", 404);
  if (ally.kind !== "pantry" && ally.kind !== "church") return fail("Only a pantry can claim a desk.");
  const body = await readJson(request);
  const typed = str(body?.confirmName);
  if (!typed || nameKey(typed) !== nameKey(ally.name)) {
    return fail(`Type the pantry name (${ally.name}) to claim it.`);
  }

  try {
    if (ally.operator_pantry_id) {
      const allowed = await isSteward(ally.operator_pantry_id, user.id, user.email);
      if (!allowed) return fail("Someone already claimed this pantry. Ask them to add you, or write Lincoln.", 409);
      await grantAllyOperator(ally.id, user.id);
      await setDesk(ally.operator_pantry_id);
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
    await setDesk(pantry.id);
    await notifyDesk({
      pantryId: home.id,
      pantryEmail: home.email,
      pantryPhone: home.phone,
      subject: `Plenty: ${user.name || user.email} claimed ${ally.name}`,
      text: `${user.name || ""} ${user.email} claimed ${ally.name}.\nDesk: https://plenty.unitedundergod.org/run\nPublic: ${pantryPublicUrl(pantry.slug)}`
    }).catch(() => ({ emailed: 0, texted: 0, failed: 0, detail: "" }));
    return ok({
      pantryId: pantry.id,
      slug: pantry.slug,
      publicUrl: pantryPublicUrl(pantry.slug),
      message: `${pantry.name} is yours to run. Hours, shelves, and volunteers stay on this pantry — not Vidalia.`
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not claim that pantry.", 503);
  }
}
