import { fail, ok, readJson, requireStewardFor, requireUser, str } from "@/lib/api";
import { getShift, signupForShift, updateShiftSignup } from "@/lib/db/queries";
import { notifyDesk } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const { id } = await context.params;
  const body = (await readJson(request)) || {};
  const action = str(body.action) || "signup";
  try {
    const shift = await getShift(id);
    if (action === "signup") {
      await signupForShift(id, user.id);
      if (shift) {
        await notifyDesk({
          pantryId: shift.pantry_id,
          subject: `Volunteer signed up: ${shift.title}`,
          text: `${user.name || user.email} signed up for ${shift.title} at ${shift.location || "the pantry"}.\nhttps://plenty.unitedundergod.org/run/shifts`
        }).catch(() => ({ emailed: 0, texted: 0, failed: 0, detail: "" }));
      }
      return ok({ message: "You are on this shift. Confirm when you know you can come." });
    }
    if (action === "confirm" || action === "need_cover" || action === "cancel") {
      await updateShiftSignup({ shiftId: id, userId: user.id, action, actorId: user.id });
      if (shift && (action === "need_cover" || action === "cancel")) {
        await notifyDesk({
          pantryId: shift.pantry_id,
          subject: action === "need_cover" ? `Cover needed: ${shift.title}` : `Volunteer cancelled: ${shift.title}`,
          text: `${user.name || user.email} ${action === "need_cover" ? "needs cover" : "cancelled"} for ${shift.title}.\nhttps://plenty.unitedundergod.org/volunteer`
        }).catch(() => ({ emailed: 0, texted: 0, failed: 0, detail: "" }));
      }
      const messages = {
        confirm: "Thanks — we will look for you.",
        need_cover: "Cover requested. Other volunteers can take this shift.",
        cancel: "You are off this shift."
      } as const;
      return ok({ message: messages[action] });
    }
    if (action === "take_cover") {
      const fromUserId = str(body.userId);
      if (!fromUserId) return fail("Which volunteer needs cover?");
      await updateShiftSignup({ shiftId: id, userId: fromUserId, action: "take_cover", actorId: user.id });
      if (shift) {
        await notifyDesk({
          pantryId: shift.pantry_id,
          subject: `Cover filled: ${shift.title}`,
          text: `${user.name || user.email} took the cover for ${shift.title}.\nhttps://plenty.unitedundergod.org/run/shifts`
        }).catch(() => ({ emailed: 0, texted: 0, failed: 0, detail: "" }));
      }
      return ok({ message: "You have that shift now. Thank you for covering." });
    }
    if (action === "no_show") {
      if (!shift) return fail("That shift is not on the board.");
      const steward = await requireStewardFor(shift.pantry_id);
      if (steward.error) return steward.error;
      const who = str(body.userId);
      if (!who) return fail("Which volunteer?");
      await updateShiftSignup({ shiftId: id, userId: who, action: "no_show", actorId: user.id });
      return ok({ message: "Marked as no-show. They can still sign up next time." });
    }
    return fail("Unknown shift action.");
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update that shift.", 400);
  }
}
