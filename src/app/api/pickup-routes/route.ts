import { fail, ok, readJson, requireDeskPantry, str } from "@/lib/api";
import { deletePickupRoute, listPickupRoutes, savePickupRoute } from "@/lib/db/pickup-desk";
import { PICKUP_ROUTE_KINDS, PICKUP_WEEKDAYS, cleanRouteEmail } from "@/lib/pickup-routes";

export const dynamic = "force-dynamic";

const KINDS = new Set<string>(PICKUP_ROUTE_KINDS);
const DAYS = new Set<string>(PICKUP_WEEKDAYS);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const desk = await requireDeskPantry({ pantryId: url.searchParams.get("pantryId") || "" });
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry desk for this account.", 403);
  try {
    const routes = await listPickupRoutes(desk.pantry.id);
    return ok({ ready: routes.ready, routes: routes.rows });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not load routes.", 503);
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const desk = await requireDeskPantry(body);
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry desk for this account.", 403);
  try {
    if (str(body.remove) === "1" || str(body.remove) === "true") {
      const id = str(body.id);
      if (!id) return fail("Say which route to remove.");
      const result = await deletePickupRoute(desk.pantry.id, id);
      if (!result.ready) return fail("Pickup routes are not on this database yet.", 503);
      return ok({ message: "Route removed." });
    }
    const kind = str(body.kind) || "any";
    const weekday = str(body.weekday) || "any";
    const email = cleanRouteEmail(str(body.email));
    if (!KINDS.has(kind)) return fail("Choose a pickup type.");
    if (!DAYS.has(weekday)) return fail("Choose a day, or any day.");
    if (!email) return fail("Enter an email address.");
    const result = await savePickupRoute({
      pantryId: desk.pantry.id,
      kind,
      weekday,
      email,
      label: str(body.label)
    });
    if (!result.ready) return fail("Pickup routes are not on this database yet.", 503);
    return ok({ message: "Route saved. That address will be emailed for matching pickups." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save the route.";
    if (/duplicate|unique/i.test(message)) return fail("That address is already on this route.");
    return fail(message, 503);
  }
}
