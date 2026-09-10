import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { addDonation, listStorePartners, updateStorePartner } from "@/lib/db/queries";
import { DONOR_ACTIVITY_KINDS, encodeDonorMeta, parseDonorMeta } from "@/lib/donors/starting";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const partnerId = str(body.partnerId);
  const partners = await listStorePartners(pantry.id);
  const partner = partners.find((p) => p.id === partnerId);
  if (!partner) return fail("Pick a donor.");
  const kind = str(body.kind) || "donor_note";
  if (!(DONOR_ACTIVITY_KINDS as readonly string[]).includes(kind)) return fail("Choose call, visit, gift, email, or note.");
  const description = str(body.body);
  if (!description) return fail("Write what happened.");
  const next = str(body.nextFollowUp);
  const food = str(body.foodNote) || parseDonorMeta(partner.notes).gives.join(", ");
  try {
    await addDonation({
      pantryId: pantry.id,
      userId: user?.id || null,
      kind,
      title: partner.name,
      description,
      quantity: food,
      amountCents: null,
      availableWhen: next,
      contactName: str(body.contactName) || partner.contact_name,
      contactPhone: partner.phone,
      contactEmail: partner.contact_email
    });
    const meta = parseDonorMeta(partner.notes);
    const stamp = new Date().toISOString().slice(0, 10);
    const line = `[${stamp}] ${kind.replace("donor_", "")}: ${description}`;
    await updateStorePartner(partner.id, pantry.id, {
      status: kind === "donor_gift" ? "active" : partner.status,
      notes: `${encodeDonorMeta({ kind: meta.kind || "warehouse", gives: meta.gives, next })}\n${meta.body}\n${line}`
    });
    return ok({
      message:
        kind === "donor_gift"
          ? "Gift logged. They are marked as giving. Ask for a pickup when they have food on the dock."
          : next
            ? "Logged. Follow-up is on this desk."
            : "Logged."
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not log that.", 503);
  }
}
