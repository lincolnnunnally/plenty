import { cookies } from "next/headers";
import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { getPantryById } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pantryId = str(body.pantryId);
  if (!pantryId) return fail("Choose a pantry.");
  const pantry = await getPantryById(pantryId);
  if (!pantry) return fail("Pantry not found.", 404);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const jar = await cookies();
  jar.set("plenty_desk", pantry.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90
  });
  return ok({ message: `Desk is now ${pantry.name}.` });
}
