import { LineFlow } from "@/components/line-flow";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { effectivePayMethods } from "@/lib/db/queries";
import { pantryLineUrl } from "@/lib/public-url";
import { stripeConfigured } from "@/lib/stripe-give";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RunLinePage() {
  const { pantry, pantries, superAdmin } = await requirePantryDesk("/run/line");
  if (!pantry) redirect("/run");
  const methods = await effectivePayMethods(pantry).catch(() => []);
  const cardLive = await stripeConfigured();
  const line = pantryLineUrl(pantry.slug);

  return (
    <main className="shell">
      <p className="eyebrow">Line</p>
      <h1>Check people in. Request a handling donation.</h1>
      <p className="lede">
        If they have a phone, they scan the QR. If they do not, type their name. The food is free. We request a
        donation for handling and orchestration — not for the groceries. If they cannot, they still eat.
      </p>
      <RunNav pantries={pantries} currentId={pantry.id} superAdmin={superAdmin} />
      <section className="panel">
        <h2>QR for this pantry</h2>
        <p className="note">Print this and put it on the table. {line}</p>
        <img
          className="pay-qr"
          src={`/api/promote/qr?to=${encodeURIComponent(line)}&size=360`}
          alt="Line check-in QR"
          width={180}
          height={180}
        />
        <div className="action-row">
          <a className="button primary" href={line}>Open the neighbor page</a>
          <a className="button" href={`/api/promote/qr?to=${encodeURIComponent(line)}&size=640`}>Download QR</a>
        </div>
      </section>
      <LineFlow slug={pantry.slug} pantryName={pantry.name} methods={methods} cardLive={cardLive} desk />
    </main>
  );
}
