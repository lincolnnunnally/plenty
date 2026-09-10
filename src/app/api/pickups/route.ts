import { fail, ok, readJson, requireDeskPantry, requireStewardFor, requireUser, str } from "@/lib/api";
import { addPickup, getDefaultPantry, getHousehold, getPickup, householdForUser, listVolunteers, patchPickup, setPickupStatus } from "@/lib/db/queries";
import { notifyCrew, notifyPeople, sendSms } from "@/lib/notify";

export const dynamic = "force-dynamic";

function on(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "yes";
}

async function pingHousehold(phone: string, when: string | null, extra: string, reachOk = true) {
  if (!phone || !reachOk) return;
  const time = when ? new Date(when).toLocaleString() : "soon";
  await sendSms(phone, `Plenty: food is coming ${time}. ${extra} If plans change, call the pantry.`.slice(0, 1500)).catch(() => ({ ok: false, error: "" }));
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  if (str(body.id) && (str(body.address) || str(body.status))) {
    const desk = await requireDeskPantry(body);
    if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
    const pantry = desk.pantry;
    try {
      if (str(body.address) && !str(body.status)) {
        const address = str(body.address);
        const when = str(body.scheduledFor) ? new Date(str(body.scheduledFor)).toISOString() : null;
        await patchPickup(str(body.id), {
          address,
          notes: str(body.notes) || undefined,
          scheduledFor: when,
          windowText: str(body.windowText) || undefined
        });
        const crew = await listVolunteers(pantry.id);
        const assigned = str(body.assignedUserId);
        const people = assigned ? crew.filter((v) => v.user_id === assigned) : crew.filter((v) => v.roles.includes("pickup") || v.roles.includes("delivery"));
        const ping = await notifyPeople({
          pantryId: pantry.id,
          people,
          subject: "Plenty pickup location changed",
          text: `Go here: ${address}\nWhen: ${when ? new Date(when).toLocaleString() : "see the board"}\n${str(body.notes)}\nhttps://plenty.unitedundergod.org/volunteer`,
          audience: assigned ? "assigned driver" : "pickup"
        });
        const moved = await getPickup(str(body.id), pantry.id);
        if (moved?.kind === "household_delivery") {
          const hh = moved.household_id ? await getHousehold(moved.household_id, pantry.id).catch(() => null) : null;
          await pingHousehold(moved.contact_phone, moved.scheduled_for, moved.address, hh ? hh.reach_ok : true);
        }
        return ok({
          message: `Pickup moved. Emailed ${ping.emailed}, texted ${ping.texted}${ping.failed ? `. ${ping.failed} could not be reached.` : "."}`
        });
      }
      const scheduledFor = str(body.scheduledFor) ? new Date(str(body.scheduledFor)).toISOString() : undefined;
      await setPickupStatus(str(body.id), str(body.status), {
        assignedUserId: str(body.assignedUserId) || undefined,
        scheduledFor
      });
      if (str(body.status) === "scheduled") {
        const crew = await listVolunteers(pantry.id);
        const assigned = str(body.assignedUserId);
        const people = assigned ? crew.filter((v) => v.user_id === assigned) : [];
        const ping = people.length
          ? await notifyPeople({
              pantryId: pantry.id,
              people,
              subject: "Plenty pickup assigned to you",
              text: `A pickup is scheduled.\nWhen: ${scheduledFor ? new Date(scheduledFor).toLocaleString() : "see the board"}\nhttps://plenty.unitedundergod.org/volunteer`,
              audience: "assigned"
            })
          : await notifyCrew({
              pantryId: pantry.id,
              crew,
              roles: ["pickup", "delivery"],
              subject: "Plenty pickup scheduled",
              text: `A pickup is on the board.\nWhen: ${scheduledFor ? new Date(scheduledFor).toLocaleString() : "see the board"}\nhttps://plenty.unitedundergod.org/volunteer`
            });
        const row = await getPickup(str(body.id), pantry.id);
        if (row?.kind === "household_delivery") {
          const hh = row.household_id ? await getHousehold(row.household_id, pantry.id).catch(() => null) : null;
          await pingHousehold(row.contact_phone, row.scheduled_for, [row.address, row.window_text].filter(Boolean).join(" · "), hh ? hh.reach_ok : true);
        }
        return ok({
          message: `Pickup updated. Emailed ${ping.emailed}, texted ${ping.texted}${ping.failed ? `. ${ping.failed} could not be reached.` : "."} The household was texted if we have a phone.`
        });
      }
      return ok({ message: "Pickup updated." });
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Could not update the pickup.", 503);
    }
  }
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const kind = str(body.kind);
  if (kind !== "donation_pickup" && kind !== "household_delivery") {
    return fail("Say whether this is a donation pickup or a delivery to a household.");
  }
  const address = str(body.address);
  if (!address) return fail("We need an address.");
  const steward = await requireStewardFor(pantry.id);
  const mine = await householdForUser(pantry.id, user.id);
  const householdId =
    kind === "household_delivery"
      ? (steward.error ? mine?.id : str(body.householdId) || mine?.id) || null
      : null;
  try {
    await addPickup({
      pantryId: pantry.id,
      kind,
      scheduledFor: str(body.scheduledFor) ? new Date(str(body.scheduledFor)).toISOString() : null,
      address,
      contactName: str(body.contactName) || user.name,
      contactPhone: str(body.contactPhone),
      notes: str(body.notes),
      createdBy: user.id,
      householdId,
      willBeHome: body.willBeHome === undefined || body.willBeHome === "" ? null : on(body.willBeHome),
      porchLeaveOk: on(body.porchLeaveOk),
      windowText: str(body.windowText)
    });
    if (kind === "household_delivery") {
      const crew = await listVolunteers(pantry.id);
      await notifyCrew({
        pantryId: pantry.id,
        crew,
        roles: ["delivery", "pickup"],
        subject: "Plenty delivery requested",
        text: `A household asked for food to be brought to them.\n${address}\n${str(body.windowText)}\n${str(body.notes)}\nhttps://plenty.unitedundergod.org/run/pickups`
      }).catch(() => ({ emailed: 0, texted: 0, failed: 0, detail: "" }));
    }
    return ok({ message: "Request received. We will confirm a time and make sure someone is coming." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the request.", 503);
  }
}
