import { DriveLink } from "@/components/drive-link";
import { GiveCardForm } from "@/components/give-card";
import { PostForm } from "@/components/post-form";
import { SignOutForm } from "@/components/sign-out-form";
import { membershipLabel } from "@/lib/auth/roles";
import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantrySafe, giftsForUser, getTaxProfile, hoursForUser, householdForUser, isSteward, listedAllies, listStoreVouchers, membershipsForUser, myShiftSignups, openDeliveriesForHousehold, unusedHandling, visitsForUser, ensureToombsStartingPoints } from "@/lib/db/queries";
import { ABUNDANCE_SHARE, DELIVERY_INVITE, HANDLING_DONATION } from "@/lib/promote/compose";
import { HANDOFFS } from "@/lib/handoffs";
import { coordsForName } from "@/lib/maps";
import { passUrl } from "@/lib/pass";
import { planIdsFromNotes } from "@/lib/plan";
import { stripeConfigured } from "@/lib/stripe-give";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireCustomerAccess("/account");
  const memberships = await membershipsForUser(user.id).catch(() => []);
  const pantry = await getDefaultPantrySafe();
  const steward = pantry ? await isSteward(pantry.id, user.id, user.email).catch(() => false) : false;
  const gifts = await giftsForUser(user.id).catch(() => []);
  const tax = pantry ? await getTaxProfile(pantry.id).catch(() => null) : null;
  const receivedMoney = gifts.filter((g) => g.kind === "money" && g.status === "received");
  const roles = memberships.map((m) => m.role);
  const visits = pantry ? await visitsForUser(pantry.id, user.id).catch(() => []) : [];
  const hours = pantry ? await hoursForUser(pantry.id, user.id).catch(() => []) : [];
  const myShifts = await myShiftSignups(user.id).catch(() => []);
  const household = pantry ? await householdForUser(pantry.id, user.id).catch(() => null) : null;
  if (pantry) await ensureToombsStartingPoints(pantry.id).catch(() => 0);
  const around = pantry ? await listedAllies(pantry.id).catch(() => []) : [];
  const openPantries = around.filter((a) => a.kind === "pantry" && a.relationship !== "closed");
  const plan = planIdsFromNotes(household?.notes || "");
  const chosen = openPantries.filter((a) => plan.includes(a.id));
  const hubOn = plan.includes("hub") || plan.includes(pantry?.id || "");
  const storeCards = household && pantry ? (await listStoreVouchers(pantry.id, { householdId: household.id }).catch(() => [])).filter((v) => v.status === "issued") : [];
  const credits = household ? await unusedHandling(household.id).catch(() => []) : [];
  const deliveries = household && pantry ? await openDeliveriesForHousehold(pantry.id, household.id).catch(() => []) : [];
  const cardLive = await stripeConfigured();
  const pass = household?.pass_code ? passUrl(household.pass_code) : "";
  const roleLabel = roles.includes("neighbor") && roles.includes("volunteer")
    ? "You get food here and you also volunteer."
    : roles.includes("neighbor")
      ? "You are registered to get food."
      : roles.includes("volunteer")
        ? "You volunteer at this food pantry."
        : roles.includes("donor")
          ? "You give to this food pantry."
          : "Tell us if you need food, volunteer, or give — from Get food, Volunteer, or Give.";

  return (
    <main className="shell">
      <p className="eyebrow">Your account</p>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p className="lede">{roleLabel} Food is free. Visits are a count, not a bill.</p>
      <div className="chip-row">
        {roles.filter((r) => r !== "steward" && r !== "admin").map((role) => (
          <span className="chip active" key={role}>{membershipLabel(role)}</span>
        ))}
      </div>
      <div className="action-row">
        <a className="button primary" href="/need-food">Get food</a>
        <a className="button" href="/volunteer">Volunteer</a>
        <a className="button" href="/donate">Give</a>
        {steward ? <a className="button leaf" href="/run">Open pantry desk</a> : null}
      </div>

      {household && pass ? (
        <section className="panel">
          <h2>Your line pass</h2>
          <p className="lede">Open this at the pantry. We scan it, see you, see if handling is already given, and check you in.</p>
          <img className="pay-qr" src={`/api/promote/qr?to=${encodeURIComponent(pass)}&size=360`} alt="Your Plenty pass" width={200} height={200} />
          <p className="note">{household.pass_code} · {credits.length ? "Handling already given — it will show when we scan." : "No handling donation on file. Requested, not required."}</p>
          <p className="note">{HANDLING_DONATION}</p>
          <div className="action-row">
            <a className="button primary" href={pass}>Open pass page</a>
            {pantry ? <a className="button" href={`/line/${pantry.slug}?pass=${encodeURIComponent(household.pass_code)}`}>Check in at the line</a> : null}
          </div>
          <h3 style={{ marginTop: 24 }}>Pay handling now</h3>
          <p className="note">Pay before you arrive, or when you get there. Either way the food is free.</p>
          {cardLive && pantry ? (
            <GiveCardForm signedInEmail={user.email} pantrySlug={pantry.slug} householdId={household.id} upfront />
          ) : (
            <p className="empty">Card is not live yet. Use Cash App, Venmo, or Zelle on Give, or pay at the line.</p>
          )}
        </section>
      ) : (
        <p className="note"><a href="/need-food">Register your household</a> to get a line pass.</p>
      )}

      {household ? (
        <section className="panel">
          <h2>Need food brought to you?</h2>
          <p className="note">{DELIVERY_INVITE}</p>
          {deliveries.length ? <p>{deliveries.length} open delivery request(s).</p> : null}
          <PostForm action="/api/pickups" submitLabel="Request a delivery">
            <input type="hidden" name="kind" value="household_delivery" />
            <input type="hidden" name="householdId" value={household.id} />
            <label className="field"><span>Address</span><input className="input" name="address" required defaultValue={household.address} /></label>
            <label className="field"><span>Phone</span><input className="input" name="contactPhone" defaultValue={household.phone} /></label>
            <label className="field"><span>When / window</span><input className="input" name="windowText" placeholder="After 4, Saturday morning…" /></label>
            <label className="check"><input type="checkbox" name="willBeHome" defaultChecked /> Someone will be home</label>
            <label className="check"><input type="checkbox" name="porchLeaveOk" defaultChecked={household.porch_leave_ok} /> OK to leave on the porch</label>
          </PostForm>
        </section>
      ) : null}

      <section className="panel">
        <h2>Your visits</h2>
        <p className="lede">{visits.length} time{visits.length === 1 ? "" : "s"} we saw you. Not a limit. Not a charge.</p>
        {visits.length ? (
          <ul>
            {visits.slice(0, 8).map((v) => (
              <li key={v.id}>{new Date(v.visited_at).toLocaleDateString()}{v.items_summary ? ` · ${v.items_summary}` : ""}</li>
            ))}
          </ul>
        ) : (
          <p className="empty">Come through the line. We will write it down here.</p>
        )}
      </section>

      {household ? (
        <section className="panel">
          <h2>Pantries you go to</h2>
          <p className="note">Pick the doors you use. Hours are what we saw, not a guess. Food at Plenty is still free if you walk in without this list.</p>
          {hubOn || chosen.length ? (
            <div className="grid">
              {hubOn && pantry ? (
                <article className="card">
                  <span>{pantry.city || "Vidalia"}</span>
                  <strong>{pantry.name}</strong>
                  <p>{pantry.hours_text || "Hours posted when we have a line."}</p>
                  <div className="action-row">
                    <a className="button primary" href={`/line/${pantry.slug}`}>Check in</a>
                    {pantry.address ? <DriveLink address={pantry.address} city={pantry.city} state={pantry.state} zip={pantry.zip} /> : null}
                  </div>
                </article>
              ) : null}
              {chosen.map((a) => {
                const pin = coordsForName(a.name);
                return (
                  <article className="card" key={a.id}>
                    <span>{a.city}</span>
                    <strong>{a.name}</strong>
                    <p>{a.hours_text || "Call for hours."}</p>
                    <DriveLink address={a.address} city={a.city} state={a.state} zip={a.zip} lat={pin?.lat} lon={pin?.lon} />
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="empty">No pantries picked yet.</p>
          )}
          <h3 style={{ marginTop: 20 }}>Save which doors you use</h3>
          <PostForm action="/api/households" submitLabel="Save my pantries">
            <input type="hidden" name="displayName" value={household.display_name} />
            <input type="hidden" name="householdSize" value={String(household.household_size)} />
            <input type="hidden" name="phone" value={household.phone || ""} />
            <input type="hidden" name="planIds" value="" />
            <label className="check"><input type="checkbox" name="planIds" value="hub" defaultChecked={hubOn} /> {pantry?.name || "Vidalia Plenty"}</label>
            {openPantries.map((a) => (
              <label className="check" key={a.id}><input type="checkbox" name="planIds" value={a.id} defaultChecked={plan.includes(a.id)} /> {a.name} — {a.hours_text || a.city}</label>
            ))}
          </PostForm>
        </section>
      ) : null}

      <section className="panel">
        <h2>A next step — when you want it</h2>
        <p className="note">Groceries do not depend on this. When you are ready, receiving can become helping, or growing.</p>
        <div className="grid">
          <article className="card">
            <strong>Help at the pantry</strong>
            <p>Pickup, the line, or a delivery. Same account.</p>
            <a className="button leaf" href="/volunteer">Take a shift</a>
          </article>
          <article className="card">
            <strong>Grow in faith</strong>
            <p>A church, a prayer, a friend who walks with you.</p>
            <a className="button" href="https://churchconnect.unitedundergod.org/" target="_blank" rel="noreferrer">ChurchConnect</a>
          </article>
          <article className="card">
            <strong>Learn a skill</strong>
            <p>Work, money, habits, a practical next step.</p>
            <a className="button" href="https://bestlife.unitedundergod.org/" target="_blank" rel="noreferrer">Best Life</a>
          </article>
        </div>
        <p className="note"><a href="/become">Write one next step in your own words</a>.</p>
      </section>

      <section className="panel">
        <h2>Connected help</h2>
        <p className="note">{ABUNDANCE_SHARE} This account is you across United Under God — we can walk with you after groceries, if you want.</p>
        <div className="grid">
          {HANDOFFS.slice(0, 4).map((h) => (
            <article className="card" key={h.id}>
              <strong>{h.name}</strong>
              <p>{h.when}</p>
              <a className="button" href={h.href}>Open</a>
            </article>
          ))}
        </div>
        <p className="note"><a href="/become">Write one next step</a> — optional.</p>
      </section>

      {storeCards.length ? (
        <section className="panel">
          <h2>Your grocery store card</h2>
          <p className="note">Get the bag first, then shop if you want. You do not have to buy anything.</p>
          <div className="grid">
            {storeCards.map((card) => (
              <article className="card" key={card.id}>
                <span>{card.code} · {card.partner_name}</span>
                <strong>{card.hold_desk || "Customer service"}</strong>
                <p>{card.items_text || "This week's hold"}</p>
                <a className="button primary" href={`/api/store-card?voucherId=${card.id}`}>Print card</a>
                <a className="button" href={`/api/store-card?kind=slip&voucherId=${card.id}`}>Bag slip</a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>Your volunteer time</h2>
        {hours.length ? (
          <p>{hours.reduce((sum, row) => sum + Number(row.hours), 0)} hours recorded. {myShifts.filter((s) => !["cancelled", "covered"].includes(s.status)).length} open shift(s).</p>
        ) : (
          <p className="empty">No hours logged yet. Log them from Volunteer.</p>
        )}
      </section>

      <section className="panel">
        <h2>Your gifts</h2>
        {gifts.length ? (
          <ul>
            {gifts.map((g) => (
              <li key={g.id}>{g.kind}{g.tenure ? ` · ${g.tenure}` : ""} · {g.title} · {g.status}{g.amount_cents ? ` · $${(g.amount_cents / 100).toFixed(0)}` : ""}</li>
            ))}
          </ul>
        ) : (
          <p className="empty">No gifts recorded on this account yet.</p>
        )}
        {receivedMoney.length && tax?.posted ? (
          <div>
            <h3>Year-end receipts</h3>
            <p className="note">Print or save these for your records. They use the tax information posted on this site.</p>
            {receivedMoney.map((g) => (
              <article className="card" key={g.id}>
                <strong>Receipt · {new Date(g.received_at || g.created_at).toLocaleDateString()}</strong>
                <p>{tax.legal_name || "Plenty food pantry"}</p>
                {tax.ein ? <p>EIN {tax.ein}</p> : null}
                <p>Thank you, {g.contact_name || user.name}. We received ${((g.amount_cents || 0) / 100).toFixed(0)} for the Vidalia food pantry. No goods or services were provided in exchange.</p>
              </article>
            ))}
          </div>
        ) : receivedMoney.length ? (
          <p className="note">Money gifts are on file. Formal receipts will appear here when tax-exempt information is posted.</p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Sign out</h2>
        <p className="note">This ends your session on this device. You can sign back in any time with the same email.</p>
        <SignOutForm buttonClassName="button" />
      </section>
    </main>
  );
}
