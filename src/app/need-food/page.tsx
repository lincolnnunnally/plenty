import { cookies } from "next/headers";
import { PayBoard } from "@/components/pay-board";
import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth/session";
import { FOOD_WAIVER_VERSION } from "@/lib/legal/food-waiver";
import { availableThisWeek, effectivePayMethods, getDefaultPantrySafe, householdForUser, latestWaiverForUser, listStoreVouchers } from "@/lib/db/queries";
import { HANDLING_DONATION } from "@/lib/promote/compose";
import { passUrl } from "@/lib/pass";
import { readLang, t } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Get free groceries in Vidalia",
  "Plenty food pantry in Vidalia. Free groceries. No income test. Register, come through the line, or ask for a delivery."
);

export default async function NeedFoodPage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  const available = pantry ? await availableThisWeek(pantry.id).catch(() => []) : [];
  const household = user && pantry ? await householdForUser(pantry.id, user.id).catch(() => null) : null;
  const waiver = user && pantry ? await latestWaiverForUser(pantry.id, user.id).catch(() => null) : null;
  const storeCards = household && pantry ? (await listStoreVouchers(pantry.id, { householdId: household.id }).catch(() => [])).filter((v) => v.status === "issued") : [];
  const pay = pantry ? await effectivePayMethods(pantry).catch(() => []) : [];
  const waiverOk =
    (household?.food_waiver_version === FOOD_WAIVER_VERSION && Boolean(household.food_waiver_signed_at)) ||
    waiver?.version === FOOD_WAIVER_VERSION;
  const pass = household?.pass_code ? passUrl(household.pass_code) : "";
  const lang = readLang((await cookies()).get("plenty_lang")?.value);

  return (
    <main className="shell">
      <p className="eyebrow">{t(lang, "getFood")}</p>
      <h1>{t(lang, "needTitle")}</h1>
      <p className="lede">{t(lang, "needLede")}</p>
      {pantry?.hours_text ? <p className="note">{pantry.hours_text}{pantry.address ? ` · ${pantry.address}` : ""}</p> : null}

      {!user ? (
        <section className="panel">
          <h2>Register your household</h2>
          <a className="button primary" href="/sign-in?next=/need-food&as=neighbor">Create an account</a>
        </section>
      ) : (
        <section className="panel">
          <h2>{household ? "Your household" : "Register your household"}</h2>
          <PostForm action="/api/households" submitLabel={household ? "Save" : "Save household"}>
            <label className="field"><span>Name</span><input className="input" name="displayName" defaultValue={household?.display_name || user.name} required /></label>
            <div className="grid">
              <label className="field"><span>People</span><input className="input" name="householdSize" type="number" min={1} defaultValue={household?.household_size || 1} /></label>
              <label className="field"><span>Phone</span><input className="input" name="phone" defaultValue={household?.phone || ""} /></label>
            </div>
            <label className="field"><span>Allergies / notes</span><input className="input" name="dietaryNotes" defaultValue={household?.dietary_notes || ""} /></label>
            <label className="field"><span>Address (if you need delivery)</span><input className="input" name="address" defaultValue={household?.address || ""} /></label>
            <div className="grid">
              <label className="field"><span>City</span><input className="input" name="city" defaultValue={household?.city || pantry?.city || "Vidalia"} /></label>
              <label className="field"><span>ZIP</span><input className="input" name="zip" defaultValue={household?.zip || pantry?.zip || ""} /></label>
            </div>
            <input type="hidden" name="email" value={household?.email || user.email} />
            <input type="hidden" name="state" value={household?.state || pantry?.state || "GA"} />
            <input type="hidden" name="adultsCount" value={String(household?.adults_count || 1)} />
            <label className="check"><input type="checkbox" name="deliveryOk" defaultChecked={household?.delivery_ok} /> I may need food brought to me</label>
            <label className="check"><input type="checkbox" name="porchLeaveOk" defaultChecked={household?.porch_leave_ok} /> OK to leave on the porch</label>
          </PostForm>

          {household && pass ? (
            <div style={{ marginTop: 20 }}>
              <h3>Your line pass</h3>
              <p className="note">We scan this. It shows who you are and if handling is already paid.</p>
              <img className="pay-qr" src={`/api/promote/qr?to=${encodeURIComponent(pass)}&size=360`} alt="Plenty pass" width={180} height={180} />
              <p className="note">{household.pass_code}</p>
              <a className="button primary" href={pass}>Open pass</a>
            </div>
          ) : null}

          {household && !waiverOk ? (
            <p style={{ marginTop: 16 }}>Sign the short food agreement so stores can keep giving. <a className="button" href="/waiver">Sign</a></p>
          ) : null}

          {household ? (
            <>
              <h3 style={{ marginTop: 24 }}>Need a delivery?</h3>
              <PostForm action="/api/pickups" submitLabel="Request delivery">
                <input type="hidden" name="kind" value="household_delivery" />
                <input type="hidden" name="householdId" value={household.id} />
                <label className="field"><span>Address</span><input className="input" name="address" required defaultValue={household.address} /></label>
                <label className="field"><span>When</span><input className="input" name="windowText" placeholder="After 4, Saturday morning…" /></label>
                <label className="check"><input type="checkbox" name="willBeHome" defaultChecked /> Someone will be home</label>
                <label className="check"><input type="checkbox" name="porchLeaveOk" defaultChecked={household.porch_leave_ok} /> Porch is OK</label>
              </PostForm>

              <h3 style={{ marginTop: 24 }}>Handling</h3>
              <p className="note">{HANDLING_DONATION}</p>
              <PayBoard methods={pay} empty="Pay at the line, or say you cannot. Food still goes out." />
              <PostForm action="/api/contributions" submitLabel="I paid / I cannot">
                <label className="field"><span>Amount in dollars</span><input className="input" name="amountDollars" type="number" min="0" step="1" /></label>
                <label className="check"><input type="checkbox" name="waived" /> I cannot this time</label>
              </PostForm>
            </>
          ) : null}

          {storeCards.length ? (
            <div style={{ marginTop: 24 }}>
              <h3>Store bag</h3>
              {storeCards.map((card) => (
                <article className="card" key={card.id}>
                  <strong>{card.partner_name}</strong>
                  <p>{card.items_text || "This week's hold"}</p>
                  <a className="button" href={`/api/store-card?voucherId=${card.id}`}>Print card</a>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      )}

      {available.length ? (
        <section className="panel">
          <h2>This week</h2>
          <ul>{available.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
          <a className="button" href="/this-week">Pictures</a>
        </section>
      ) : null}
    </main>
  );
}
