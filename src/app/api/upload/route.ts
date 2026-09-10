import { fail, ok, requireDeskPantry } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return fail("Uploads are not configured.", 503);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size < 1) return fail("Choose a photo.");
  if (file.size > 6_000_000) return fail("Photo is too large. Use one under 6 MB.");
  const type = file.type || "image/jpeg";
  if (!type.startsWith("image/")) return fail("Upload a photo.");
  await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: "plenty", name: "plenty", public: true })
  });
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const path = `items/${pantry.id}/${crypto.randomUUID()}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());
  const uploaded = await fetch(`${url}/storage/v1/object/plenty/${path}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": type, "x-upsert": "true" },
    body
  });
  if (!uploaded.ok) {
    const detail = await uploaded.text();
    return fail(detail || "Could not store the photo.", 503);
  }
  const publicUrl = `${url}/storage/v1/object/public/plenty/${path}`;
  return ok({ url: publicUrl, message: "Photo saved." });
}
