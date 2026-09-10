import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { listStorePartners, updateStorePartner } from "@/lib/db/queries";
import { encodeDonorMeta, parseDonorMeta } from "@/lib/donors/starting";

export const dynamic = "force-dynamic";

function flags(body: Record<string, unknown>, key: string) {
  const value = body[key];
  const parts = Array.isArray(value) ? value.map(String) : [String(value ?? "")];
  return parts.filter((v) => v && v !== "0" && v !== "false");
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const partners = await listStorePartners(pantry.id);
  const partner = partners.find((p) => p.id === id);
  if (!partner) return fail("Donor not found.", 404);
  const current = parseDonorMeta(partner.notes);
  const gives = body.foodTypes != null ? flags(body, "foodTypes") : current.gives;
  const kind = str(body.kind) || current.kind || "warehouse";
  const next = str(body.nextFollowUp) || current.next;
  const bodyNotes = body.notes != null ? str(body.notes) : current.body;
  try {
    await updateStorePartner(id, pantry.id, {
      name: str(body.name) || undefined,
      address: body.address != null ? str(body.address) : undefined,
      city: body.city != null ? str(body.city) : undefined,
      phone: body.phone != null ? str(body.phone) : undefined,
      contactName: body.contactName != null ? str(body.contactName) : undefined,
      contactEmail: body.contactEmail != null ? str(body.contactEmail) : undefined,
      holdDesk: body.contactRole != null ? str(body.contactRole) : undefined,
      status: str(body.status) || undefined,
      notes: `${encodeDonorMeta({ kind, gives, next })}\n${bodyNotes}`
    });
    return ok({ message: "Donor saved." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update that donor.", 503);
  }
}
