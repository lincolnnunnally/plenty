import { requirePantryDesk } from "@/lib/auth/session";
import { kitFor } from "@/lib/promote/facts";
import { pantryPublicUrl } from "@/lib/public-url";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PrintPromotePage({
  searchParams
}: {
  searchParams: Promise<{ audience?: string; kind?: string; extra?: string }>;
}) {
  const { pantry } = await requirePantryDesk("/run/promote/print");
  if (!pantry) redirect("/run");
  const params = await searchParams;
  const audience = params.audience === "volunteers" || params.audience === "donors" ? params.audience : "families";
  const kind = params.kind === "card" ? "card" : "flyer";
  const extra = params.extra || "";
  const { kit } = await kitFor(pantry, audience, extra);
  const url = pantryPublicUrl(pantry.slug);
  const copies = kind === "card" ? [0, 1, 2, 3] : [0];

  return (
    <main className="print-sheet">
      <p className="print-hide note">This page is for printing. Use your browser’s Print → Save as PDF if you want a file.</p>
      <div className={kind === "card" ? "print-grid" : ""}>
        {copies.map((copy) => (
          <article className={kind === "card" ? "print-card" : "print-flyer"} key={copy}>
            <p className="print-kicker">Plenty food pantry · {kit.flyerKicker}</p>
            <h1>{kit.flyerHeadline}</h1>
            {kit.flyerBody.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <div className="print-qr">
              <img src={`/api/promote/qr?to=${encodeURIComponent(url)}&format=png&size=480`} alt="QR code" />
              <span>{url}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
