import { NextResponse } from "next/server";
import { getDefaultPantry } from "@/lib/db/queries";
import { pantryPublicUrl } from "@/lib/public-url";
import { qrPng, qrSvg } from "@/lib/promote/qr";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pantry = await getDefaultPantry();
  const target = searchParams.get("to") || (pantry ? pantryPublicUrl(pantry.slug) : "https://plenty.unitedundergod.org");
  const format = searchParams.get("format") || "png";
  if (format === "svg") {
    const svg = await qrSvg(target);
    return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" } });
  }
  const png = await qrPng(target, Number(searchParams.get("size") || 640));
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="plenty-qr.png"`,
      "Cache-Control": "public, max-age=300"
    }
  });
}
