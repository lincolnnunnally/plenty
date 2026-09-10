import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { signupForShift, updateShiftSignup } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const { id } = await context.params;
  const body = (await readJson(request)) || {};
  const action = str(body.action) || "signup";
  try {
    if (action === "signup") {
      await signupForShift(id, user.id);
      return ok({ message: "You are on this shift. Confirm when you know you can come." });
    }
    if (action === "confirm" || action === "need_cover" || action === "cancel") {
      await updateShiftSignup({ shiftId: id, userId: user.id, action, actorId: user.id });
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
      return ok({ message: "You have that shift now. Thank you for covering." });
    }
    return fail("Unknown shift action.");
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update that shift.", 400);
  }
}
