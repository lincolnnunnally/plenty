import { NextResponse } from "next/server";
import { ensureToombsStartingPoints, getDefaultPantry, listedAllies } from "@/lib/db/queries";
import { mapsDirUrl } from "@/lib/maps";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pantry = await getDefaultPantry();
    if (!pantry) return NextResponse.json({ ok: false, places: [] }, { status: 503 });
    await ensureToombsStartingPoints(pantry.id);
    const listed = await listedAllies(pantry.id);
    const places = listed.map((a) => ({
      id: a.id,
      name: a.name,
      address: a.address,
      city: a.city,
      state: a.state || "GA",
      zip: a.zip,
      phone: a.phone,
      hours: a.hours_text,
      closed: a.relationship === "closed",
      drive: a.address ? mapsDirUrl(a) : "",
      source: "plenty-visit"
    }));
    return NextResponse.json({
      ok: true,
      updated: new Date().toISOString(),
      places
    });
  } catch {
    return NextResponse.json({ ok: false, places: [] }, { status: 503 });
  }
}
