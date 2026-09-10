import { ImageResponse } from "next/og";
import { getDefaultPantry } from "@/lib/db/queries";
import { kitFor } from "@/lib/promote/facts";
import { qrDataUrl } from "@/lib/promote/qr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return new Response("No pantry", { status: 503 });
  const { searchParams } = new URL(request.url);
  const audience = searchParams.get("audience") || "families";
  const kind = searchParams.get("kind") || "square";
  const extra = searchParams.get("extra") || "";
  const { kit } = await kitFor(pantry, audience, extra);
  const qr = await qrDataUrl(kit.url, 280);
  const size = kind === "story" ? { width: 1080, height: 1920 } : kind === "og" ? { width: 1200, height: 630 } : { width: 1080, height: 1080 };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: kind === "story" ? 80 : 64,
          background: "#f7f1e6",
          color: "#1f2a22",
          fontFamily: "Georgia, serif"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "#2f5d3a", fontWeight: 700 }}>
            Plenty food pantry · {kit.flyerKicker}
          </div>
          <div style={{ display: "flex", fontSize: kind === "og" ? 48 : 56, fontWeight: 700, lineHeight: 1.1, marginTop: 24 }}>
            {kit.flyerHeadline}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", width: 620, fontSize: 28, lineHeight: 1.35 }}>
            {kit.flyerBody.slice(0, 4).map((line) => (
              <div key={line} style={{ display: "flex", marginBottom: 10 }}>
                {line}
              </div>
            ))}
          </div>
          <img src={qr} width={kind === "og" ? 180 : 240} height={kind === "og" ? 180 : 240} alt="" />
        </div>
      </div>
    ),
    size
  );
}
