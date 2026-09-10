import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { addShift, isVolunteerRole, listShiftSignups, listVolunteers, patchShift } from "@/lib/db/queries";
import { notifyCrew, notifyPeople } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  if (str(body.id) && (str(body.location) || str(body.startsAt) || str(body.notes))) {
    try {
      const location = str(body.location);
      const startsAt = str(body.startsAt);
      await patchShift(str(body.id), {
        location: location || undefined,
        notes: str(body.notes) || undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        title: str(body.title) || undefined
      });
      const signups = (await listShiftSignups(pantry.id)).filter(
        (s) => s.shift_id === str(body.id) && !["cancelled", "covered"].includes(s.status)
      );
      const ping = signups.length
        ? await notifyPeople({
            pantryId: pantry.id,
            people: signups.map((s) => ({ email: s.email || null, phone: s.phone || null, name: s.name || null, roles: [s.role || "serve"] })),
            subject: "Plenty shift location changed",
            text: `Go here: ${location || "see the board"}\nWhen: ${startsAt ? new Date(startsAt).toLocaleString() : "same time"}\n${str(body.notes)}\nhttps://plenty.unitedundergod.org/volunteer`,
            audience: "signed-up"
          })
        : await notifyCrew({
            pantryId: pantry.id,
            crew: await listVolunteers(pantry.id),
            roles: [str(body.role) || "pickup", "serve", "setup", "delivery", "store_meet"],
            subject: "Plenty shift location changed",
            text: `Go here: ${location || "see the board"}\nWhen: ${startsAt ? new Date(startsAt).toLocaleString() : "see the board"}\n${str(body.notes)}\nhttps://plenty.unitedundergod.org/volunteer`
          });
      return ok({
        message: `Shift updated. Emailed ${ping.emailed}, texted ${ping.texted}${ping.failed ? `. ${ping.failed} could not be reached.` : "."}`
      });
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Could not move the shift.", 503);
    }
  }
  const title = str(body.title);
  const startsAt = str(body.startsAt);
  if (!title || !startsAt) return fail("A shift needs a name and a start time.");
  const role = str(body.role) || "serve";
  if (!isVolunteerRole(role)) return fail("Role must be pickup, setup, serve, delivery, or meet families at a store.");
  const endsAt = str(body.endsAt) || null;
  const capacityRaw = str(body.capacity);
  try {
    const location = str(body.location) || pantry.address || pantry.city;
    const startIso = new Date(startsAt).toISOString();
    await addShift({
      pantryId: pantry.id,
      title,
      role,
      startsAt: startIso,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      location,
      capacity: capacityRaw ? Number(capacityRaw) : null,
      notes: str(body.notes),
      createdBy: user.id
    });
    const crew = await listVolunteers(pantry.id);
    const ping = await notifyCrew({
      pantryId: pantry.id,
      crew,
      roles: [role],
      subject: `Plenty shift: ${title}`,
      text: `${title}\nWhere: ${location}\nWhen: ${new Date(startIso).toLocaleString()}\n${str(body.notes)}\nSign up: https://plenty.unitedundergod.org/volunteer`
    }).catch(() => ({ emailed: 0, texted: 0, failed: 0, detail: "" }));
    return ok({
      message: `Shift posted. Emailed ${ping.emailed}, texted ${ping.texted}${ping.failed ? `. ${ping.failed} could not be reached.` : "."}`
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not post the shift.", 503);
  }
}
