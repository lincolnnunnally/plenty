import { NextResponse } from "next/server";
import { addDistribution, addShift, getDefaultPantry, listActiveRecurring, listStorePartners, listVolunteers, markRecurringRun } from "@/lib/db/queries";
import { listFoodLoads, offerFoodLoad, updateFoodLoad } from "@/lib/db/food-loads";
import { notifyCrew, notifyDesk } from "@/lib/notify";
import { nextEasternOccurrence, shouldRunThisWeek } from "@/lib/schedule";
import { itemsForRecurringPickup, parseFoodNote } from "@/lib/store-pitch";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const header = request.headers.get("authorization") || "";
  if (secret && header === `Bearer ${secret}`) return true;
  if (request.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const jobs = await listActiveRecurring();
  const made: string[] = [];
  for (const job of jobs) {
    const when = nextEasternOccurrence(job.weekday, job.time_local);
    const day = when.toISOString().slice(0, 10);
    if (job.last_run_on === day) continue;
    if (when.getTime() - Date.now() > 36 * 3600000) continue;
    if (!shouldRunThisWeek(job.notes, when)) continue;
    if (job.kind === "distribution") {
      await addDistribution({
        pantryId: job.pantry_id,
        title: job.title,
        startsAt: when.toISOString(),
        endsAt: new Date(when.getTime() + 3 * 3600000).toISOString(),
        notes: job.notes || `Where: ${job.location}`
      });
      const crew = await listVolunteers(job.pantry_id);
      await notifyCrew({
        pantryId: job.pantry_id,
        crew,
        roles: ["serve", "setup"],
        subject: `Plenty distribution: ${job.title}`,
        text: `${job.title}\nWhere: ${job.location}\nWhen: ${when.toLocaleString()}\n${job.notes}\nhttps://plenty.unitedundergod.org/volunteer`
      }).catch((err) => {
        made.push(`notify failed for ${job.title}: ${err instanceof Error ? err.message : "unknown"}`);
        return { emailed: 0, texted: 0, failed: 0, detail: "" };
      });
    } else if (job.kind === "store_pickup" && job.partner_id) {
      const pantry = await getDefaultPantry();
      if (!pantry) continue;
      const partners = await listStorePartners(job.pantry_id);
      const partner = partners.find((p) => p.id === job.partner_id);
      if (!partner || partner.status === "paused") continue;
      const foods = parseFoodNote([job.notes, partner.notes].filter(Boolean).join("\n"));
      await offerFoodLoad({
        pantryId: job.pantry_id,
        partnerId: partner.id,
        mode: partner.pickup_mode,
        leftover: true,
        pickupAt: when.toISOString(),
        holdUntil: null,
        notes: job.notes || "Recurring leftover pickup",
        items: itemsForRecurringPickup(foods, when),
        partnerName: partner.name,
        partnerAddress: [partner.address, partner.city].filter(Boolean).join(", "),
        partnerPhone: partner.phone
      });
    } else {
      await addShift({
        pantryId: job.pantry_id,
        title: job.title,
        role: job.role || "serve",
        startsAt: when.toISOString(),
        endsAt: new Date(when.getTime() + 3 * 3600000).toISOString(),
        location: job.location,
        capacity: null,
        notes: job.notes,
        createdBy: null
      });
      const crew = await listVolunteers(job.pantry_id);
      await notifyCrew({
        pantryId: job.pantry_id,
        crew,
        roles: [job.role || "serve"],
        subject: `Plenty this week: ${job.title}`,
        text: `${job.title}\nWhere: ${job.location}\nWhen: ${when.toLocaleString()}\n${job.notes}\nhttps://plenty.unitedundergod.org/volunteer`
      }).catch((err) => {
        made.push(`notify failed for ${job.title}: ${err instanceof Error ? err.message : "unknown"}`);
        return { emailed: 0, texted: 0, failed: 0, detail: "" };
      });
    }
    await markRecurringRun(job.id, day);
    made.push(job.title);
  }
  const holds = await escalateHolds().catch(() => [] as string[]);
  return NextResponse.json({ ok: true, posted: made, holdAlerts: holds });
}

async function escalateHolds() {
  const pantry = await getDefaultPantry();
  if (!pantry) return [];
  const loads = await listFoodLoads(pantry.id);
  const pinged: string[] = [];
  for (const load of loads) {
    if (!load.hold_until) continue;
    if (new Date(load.hold_until).getTime() > Date.now()) continue;
    if (!["offered", "scheduled"].includes(load.status)) continue;
    if ((load.notes || "").includes("[hold-alerted]")) continue;
    await notifyDesk({
      pantryId: pantry.id,
      pantryEmail: pantry.email,
      pantryPhone: pantry.phone,
      subject: `Hold time passed: ${load.partner_name || "a load"}`,
      text: `${load.partner_name} still needs a destination or pickup.\nHold was ${new Date(load.hold_until).toLocaleString()}.\n${load.route_reason}\nhttps://plenty.unitedundergod.org/run/food`
    }).catch(() => ({ emailed: 0, texted: 0, failed: 0, detail: "" }));
    await updateFoodLoad(load.id, pantry.id, { notes: `${load.notes || ""}\n[hold-alerted]`.trim() });
    pinged.push(load.id);
  }
  return pinged;
}
