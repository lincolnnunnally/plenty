import { fail, ok, requireUser } from "@/lib/api";
import { signupForShift } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const { id } = await context.params;
  try {
    await signupForShift(id, user.id);
    return ok({ message: "You are on this shift. Show up — they will show you what to do." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not sign up for that shift.", 400);
  }
}
