import { fail, ok, readJson, requireDeskPantry, requireStewardFor, requireUser, str } from "@/lib/api";
import { defaultPantryDestination } from "@/lib/db/pickup-desk";
import { addPickup, getDefaultPantry, getHousehold, getPickup, householdForUser, listAllies, listLocations, listVolunteers, patchPickup, setPickupStatus } from "@/lib/db/queries";
import { notifyCrew, notifyPeople, sendSms } from "@/lib/notify";
import { ownerDeskUrl } from "@/lib/owner-signup-notice";
import { deliverPickupNotice } from "@/lib/pickup-mail";
import { pickupDeliverLine } from "@/lib/pickup-routes";
import { composePickupAttention } from "@/lib/pickup-watch";

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
        const pounds =
          body.pounds === undefined
            ? undefined
            : (() => {
                const text = str(body.pounds);
                if (!text) return null;
                const amount = Number(text);
                return Number.isFinite(amount) && amount > 0 ? amount : null;
              })();
        const current = await getPickup(str(body.id), pantry.id);
        await patchPickup(str(body.id), {
          address,
          notes: str(body.notes) || undefined,
          scheduledFor: when,
          windowText: str(body.windowText) || undefined,
          destAllyId: body.destAllyId !== undefined ? str(body.destAllyId) || null : undefined,
          destLocationId: body.destLocationId !== undefined ? str(body.destLocationId) || null : undefined,
          destNote: current?.kind === "household_delivery" ? address : body.destNote !== undefined ? str(body.destNote) : undefined,
          itemsText: body.itemsText !== undefined ? str(body.itemsText) : undefined,
          pounds
        });
        const moved = await getPickup(str(body.id), pantry.id);
        const [allies, locations] = await Promise.all([
          listAllies(pantry.id).catch(() => []),
          listLocations(pantry.id).catch(() => [])
        ]);
        const place = moved?.dest_location_id ? locations.find((item) => item.id === moved.dest_location_id) : null;
        const deliverTo = moved
          ? pickupDeliverLine(moved, {
              ally: moved.dest_ally_id ? allies.find((ally) => ally.id === moved.dest_ally_id)?.name || "" : "",
              location: place ? [place.name, place.address].filter(Boolean).join(" · ") : "",
              pantry: [pantry.name, pantry.address].filter(Boolean).join(" · ")
            })
          : address;
        const crew = await listVolunteers(pantry.id);
        const assigned = str(body.assignedUserId);
        const people = assigned ? crew.filter((v) => v.user_id === assigned) : crew.filter((v) => v.roles.includes("pickup") || v.roles.includes("delivery"));
        const ping = await notifyPeople({
          pantryId: pantry.id,
          people,
          subject: "Plenty pickup location changed",
          text: `Go here: ${address}\nTake it to: ${deliverTo}\nWhen: ${when ? new Date(when).toLocaleString() : "see the board"}\n${str(body.notes)}\nhttps://plenty.unitedundergod.org/volunteer`,
          audience: assigned ? "assigned driver" : "pickup"
        });
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
    const scheduledFor = str(body.scheduledFor) ? new Date(str(body.scheduledFor)).toISOString() : null;
    const pantryDest = kind === "household_delivery" ? { destLocationId: null, destNote: address } : str(body.destNote)
      ? { destLocationId: str(body.destLocationId) || null, destNote: str(body.destNote) }
      : await defaultPantryDestination(pantry);
    const pounds = str(body.pounds) ? Number(str(body.pounds)) : null;
    const pickup = await addPickup({
      pantryId: pantry.id,
      kind,
      scheduledFor,
      address,
      contactName: str(body.contactName) || user.name,
      contactPhone: str(body.contactPhone),
      notes: str(body.notes),
      createdBy: user.id,
      householdId,
      willBeHome: body.willBeHome === undefined || body.willBeHome === "" ? null : on(body.willBeHome),
      porchLeaveOk: on(body.porchLeaveOk),
      windowText: str(body.windowText),
      destAllyId: str(body.destAllyId) || null,
      destLocationId: pantryDest.destLocationId,
      destNote: pantryDest.destNote,
      itemsText: str(body.itemsText) || str(body.notes),
      pounds: pounds != null && Number.isFinite(pounds) ? pounds : null
    });
    const notice = composePickupAttention({
      org: pickup.contact_name,
      contactName: pickup.contact_name,
      contactPhone: pickup.contact_phone,
      address: pickup.address,
      whenIso: pickup.scheduled_for,
      windowText: pickup.window_text,
      what: [pickup.items_text || pickup.notes, pickup.pounds ? `${pickup.pounds} lb` : "", pickup.dest_note ? `Take it to ${pickup.dest_note}` : ""].filter(Boolean).join(" · ") || pickup.kind.replace(/_/g, " "),
      reviewUrl: ownerDeskUrl("/run/pickups")
    });
    await deliverPickupNotice({
      notice: "new",
      pickupKind: pickup.kind,
      scheduledFor: pickup.scheduled_for,
      pantryId: pantry.id,
      pickupId: pickup.id,
      subject: notice.subject,
      text: notice.text
    }).catch(() => ({ ok: false }));
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
