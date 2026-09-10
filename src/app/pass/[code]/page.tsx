import { GiveCardForm } from "@/components/give-card";
import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getPantryById,
  householdByPass,
  isSteward,
  openDeliveriesForHousehold,
  unusedHandling
} from "@/lib/db/queries";
import { ABUNDANCE_SHARE, DELIVERY_INVITE, HANDLING_DONATION } from "@/lib/promote/compose";
import { HANDOFFS } from "@/lib/handoffs";
import { passUrl } from "@/lib/pass";
import { pageMeta } from "@/lib/seo";
import { stripeConfigured } from "@/lib/stripe-give";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return pageMeta(`Household pass ${code}`, "Show this at the Plenty line. We see if handling is already given and check you in.");
}

export default async function PassPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const household = await householdByPass(code);
  if (!household) notFound();
  const pantry = await getPantryById(household.pantry_id);
  if (!pantry) notFound();
  const user = await getCurrentUser().catch(() => null);
  const steward = user ? await isSteward(pantry.id, user.id, user.email) : false;
  const credits = await unusedHandling(household.id);
  const deliveries = await openDeliveriesForHousehold(pantry.id, household.id);
  const cardLive = await stripeConfigured();
  const url = passUrl(household.pass_code);

  return (
    <main className="shell">
      <p className="eyebrow">Household pass · {pantry.name}</p>
      <h1>{household.display_name}</h1>
      <p className="lede">
        Show this screen at the line. We scan it, see you, see if handling is already given, and check you in for today.
      </p>
      <img className="pay-qr" src={`/api/promote/qr?to=${encodeURIComponent(url)}&size=360`} alt="Household pass QR" width={200} height={200} />
      <p className="note">{household.pass_code} · {household.household_size} people</p>
      <p className={credits.length ? "note" : "empty"}>
        {credits.length
          ? `Handling already given (${credits.length}) — when you check in it will show as paid.`
          : "No handling donation on file yet. Requested, not required. The food is free."}
      </p>
      <p className="note">{HANDLING_DONATION}</p>
      <div className="action-row">
        <a className="button primary" href={`/line/${pantry.slug}?pass=${encodeURIComponent(household.pass_code)}`}>
          I&apos;m at the line — check in
        </a>
        <a className="button" href="/need-food">Request a delivery</a>
      </div>

      <section className="panel">
        <h2>Pay handling now, or at the line</h2>
        {cardLive ? (
          <GiveCardForm signedInEmail={user?.email} pantrySlug={pantry.slug} householdId={household.id} upfront />
        ) : (
          <p className="empty">Card is not live yet. Cash App, Venmo, or Zelle on Give still work.</p>
        )}
        <p className="note"><a href="/donate">Other ways to give</a></p>
      </section>

      <section className="panel">
        <h2>Need food brought to you?</h2>
        <p className="note">{DELIVERY_INVITE}</p>
        {deliveries.length ? (
          <p>We have {deliveries.length} open delivery request(s).</p>
        ) : null}
        <PostForm action="/api/pickups" submitLabel="Request a delivery">
          <input type="hidden" name="kind" value="household_delivery" />
          <input type="hidden" name="householdId" value={household.id} />
          <label className="field"><span>Address</span><input className="input" name="address" required defaultValue={household.address} /></label>
          <label className="field"><span>Phone</span><input className="input" name="contactPhone" defaultValue={household.phone} /></label>
          <label className="field"><span>When / window</span><input className="input" name="windowText" placeholder="After 4, Saturday morning…" /></label>
          <label className="check"><input type="checkbox" name="willBeHome" defaultChecked /> Someone will be home</label>
          <label className="check"><input type="checkbox" name="porchLeaveOk" /> OK to leave on the porch</label>
        </PostForm>
      </section>

      <section className="panel">
        <h2>After groceries</h2>
        <p className="note">{ABUNDANCE_SHARE} Your Plenty account is the same person across United Under God — encouragement, a next step, a place to serve.</p>
        <div className="grid">
          {HANDOFFS.slice(0, 4).map((h) => (
            <article className="card" key={h.id}>
              <strong>{h.name}</strong>
              <p>{h.when}</p>
              <a className="button" href={h.href}>Open</a>
            </article>
          ))}
        </div>
        <p className="note"><a href="/become">Write one next step</a> — optional. Food does not depend on it.</p>
      </section>
      {steward ? <p className="note"><a href={`/run/line?pass=${encodeURIComponent(household.pass_code)}`}>Open on the pantry desk</a></p> : null}
    </main>
  );
}
