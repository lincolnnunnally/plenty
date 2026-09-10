import { LineFlow } from "@/components/line-flow";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { availableThisWeek, effectivePayMethods, visitsTodayCount } from "@/lib/db/queries";
import { pantryLineUrl } from "@/lib/public-url";
import { stripeConfigured } from "@/lib/stripe-give";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RunLinePage({ searchParams }: { searchParams: Promise<{ pass?: string }> }) {
  const { pass } = await searchParams;
  const { pantry, pantries, superAdmin } = await requirePantryDesk("/run/line");
  if (!pantry) redirect("/run");
  const methods = await effectivePayMethods(pantry).catch(() => []);
  const cardLive = await stripeConfigured();
  const line = pantryLineUrl(pantry.slug);
  const week = await availableThisWeek(pantry.id).catch(() => []);
  const today = await visitsTodayCount(pantry.id).catch(() => 0);

  return (
    <main className="shell">
      <p className="eyebrow">Line</p>
      <h1>Check people in. Request a handling donation.</h1>
      <p className="lede">
        {today} {today === 1 ? "household" : "households"} through the line today. The food is free. We request a
        donation for handling — not for the groceries. If they cannot, they still eat.
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
      <LineFlow slug={pantry.slug} pantryName={pantry.name} methods={methods} cardLive={cardLive} desk initialPass={pass} week={week.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit }))} />
    </main>
  );
}
