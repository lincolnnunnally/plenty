import { NextResponse } from "next/server";
import { requireStewardFor } from "@/lib/api";
import { getDefaultPantry } from "@/lib/db/queries";
import { kitFor } from "@/lib/promote/facts";
import { flyerPdf } from "@/lib/promote/pdf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return NextResponse.json({ ok: false, message: "No pantry is set up yet." }, { status: 503 });
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const audience = searchParams.get("audience") || "families";
  const kind = searchParams.get("kind") === "card" ? "card" : "flyer";
  const extra = searchParams.get("extra") || "";
  const { kit } = await kitFor(pantry, audience, extra);
  const bytes = await flyerPdf(kit, kind);
  const filename = `plenty-${kind}-${audience}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
