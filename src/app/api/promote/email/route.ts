import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { emailsForAudience, getDefaultPantry } from "@/lib/db/queries";
import { kitFor } from "@/lib/promote/facts";
import { flyerPdf } from "@/lib/promote/pdf";
import { sendCampaignEmail } from "@/lib/promote/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const audience = str(body.audience) || "families";
  const extra = str(body.extra);
  const pasted = str(body.to)
    .split(/[,;\s]+/)
    .map((row) => row.trim().toLowerCase())
    .filter((row) => row.includes("@"));
  const roster = str(body.useRoster) === "on" || body.useRoster === true || body.useRoster === "true";
  const fromRoster = roster ? await emailsForAudience(pantry.id, audience) : [];
  const merged = new Map<string, string>();
  for (const row of fromRoster) merged.set(row.email, row.name);
  for (const email of pasted) merged.set(email, email);
  const to = [...merged.entries()].map(([email, name]) => ({ email, name }));
  if (!to.length) return fail("Add at least one email, or send to the roster for this audience.");
  const { kit } = await kitFor(pantry, audience, extra);
  try {
    const pdf = await flyerPdf(kit, "flyer");
    const result = await sendCampaignEmail({
      pantryId: pantry.id,
      audience,
      to,
      subject: str(body.subject) || kit.emailSubject,
      html: kit.emailHtml,
      attachment: { filename: `plenty-flyer-${audience}.pdf`, content: pdf, contentType: "application/pdf" }
    });
    return ok({ message: `Sent to ${result.count} ${result.count === 1 ? "person" : "people"}. A flyer was attached.`, count: result.count });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not send the email.", 503);
  }
}
