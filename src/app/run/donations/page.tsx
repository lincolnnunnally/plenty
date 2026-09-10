import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listAssets, listDonations, listPayMethods } from "@/lib/db/queries";
import { payHint, payLabel, type PayKind } from "@/lib/pay";
import { pantryLineUrl } from "@/lib/public-url";
import { stripeConfigured } from "@/lib/stripe-give";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DonationsAdminPage() {
  const { pantry, pantries, superAdmin } = await requirePantryDesk("/run/donations");
  if (!pantry) redirect("/run");
  const offers = await listDonations(pantry.id);
  const assets = await listAssets(pantry.id);
  const methods = await listPayMethods(pantry.id).catch(() => []);
  const kinds: PayKind[] = ["venmo", "cashapp", "zelle", "cash"];
  const cardLive = await stripeConfigured();
  const line = pantryLineUrl(pantry.slug);

  return (
    <main className="shell">
      <p className="eyebrow">Gifts</p>
      <h1>Food, money, vehicles, and property</h1>
      <p className="note">
        Put the Stripe secret and the Cash App / Venmo / Zelle handles on this page. Card gifts record after checkout.
        A pantry can use United Under God giving, or post its own handles. <a href="/run/receipts">Year-end receipts</a>
      </p>
      <RunNav pantries={pantries} currentId={pantry.id} superAdmin={superAdmin} />

      {superAdmin ? (
        <section className="panel">
          <h2>Card charging — United Under God Stripe</h2>
          <p className="note">
            {cardLive
              ? "A Stripe key is on file. Paste a new one only if you rotated it."
              : "Paste the live Stripe secret here. This is the United Under God 501(c)(3) key — the same one used for giving. It is not shown again after you save."}
          </p>
          <PostForm action="/api/settings/stripe" submitLabel="Save Stripe secret">
            <label className="field">
              <span>Stripe secret (sk_live_… or rk_live_…)</span>
              <input className="input" name="secret" type="password" autoComplete="off" placeholder="sk_live_…" />
            </label>
          </PostForm>
        </section>
      ) : (
        <p className="note">{cardLive ? "Card charging is live." : "Ask Lincoln to paste the Stripe secret on this page."}</p>
      )}

      <section className="panel">
        <h2>Whose Cash App, Venmo, and Zelle</h2>
        <p className="note">
          If this pantry collects through United Under God, use ours. If they have their own, post those handles below
          and choose “this pantry.”
        </p>
        <PostForm action="/api/pantries" submitLabel="Save who gets the gift">
          <input type="hidden" name="pantryId" value={pantry.id} />
          <label className="field">
            <span>Money goes to</span>
            <select className="input" name="givingMode" defaultValue={pantry.giving_mode || "own"}>
              <option value="uug">United Under God / Plenty — use our card, Cash App, Venmo, and Zelle</option>
              <option value="own">This pantry — its own Cash App, Venmo, and Zelle</option>
            </select>
          </label>
        </PostForm>
      </section>

      <section className="panel">
        <h2>This pantry&apos;s Cash App, Venmo, and Zelle</h2>
        <p className="note">
          Post the real handles. Do not invent them. They print as QR on Give and at the line
          ({line}) when this pantry uses its own giving.
        </p>
        {kinds.map((kind) => {
          const row = methods.find((m) => m.kind === kind);
          return (
            <PostForm key={kind} action="/api/pay-methods" submitLabel={`Save ${payLabel(kind)}`}>
              <input type="hidden" name="pantryId" value={pantry.id} />
              <input type="hidden" name="kind" value={kind} />
              <label className="field">
                <span>{payLabel(kind)} — {payHint(kind)}</span>
                <input className="input" name="handle" defaultValue={row?.handle || ""} placeholder={kind === "cash" ? "Desk at Saturday distribution" : ""} />
              </label>
              <label className="check">
                <input type="checkbox" name="posted" value="1" defaultChecked={Boolean(row?.posted)} />
                Show this on Give and at the pantry
              </label>
              <p className="note">{row?.posted ? "Neighbors can see this now." : "Saved privately until you check the box."}</p>
            </PostForm>
          );
        })}
      </section>

      <section className="panel">
        <h2>Record a vehicle or property the pantry uses</h2>
        <PostForm action="/api/assets" submitLabel="Record asset">
          <label className="field">
            <span>What is it</span>
            <select className="input" name="kind" defaultValue="vehicle">
              <option value="vehicle">Vehicle</option>
              <option value="warehouse">Warehouse / storage</option>
              <option value="distribution_site">Distribution site</option>
              <option value="equipment">Equipment</option>
              <option value="freezer">Freezer</option>
              <option value="cooler">Cooler</option>
            </select>
          </label>
          <label className="field">
            <span>How the pantry has it</span>
            <select className="input" name="tenure" defaultValue="donated">
              <option value="donated">Donated</option>
              <option value="loaned">Loaned</option>
              <option value="leased">Leased</option>
              <option value="rented">Rented</option>
              <option value="owned">Owned by the pantry</option>
            </select>
          </label>
          <label className="field"><span>Name</span><input className="input" name="title" required placeholder="White van, church hall, warehouse on Meadows…" /></label>
          <label className="field"><span>Details</span><textarea className="input" name="description" /></label>
          <label className="field"><span>Donor or owner name</span><input className="input" name="donorName" /></label>
          <label className="field"><span>Notes</span><input className="input" name="notes" /></label>
        </PostForm>
        {assets.length ? (
          <div className="grid" style={{ marginTop: 18 }}>
            {assets.map((a) => (
              <article className="card" key={a.id}>
                <span>{a.kind.replace("_", " ")} · {a.tenure} · {a.status}</span>
                <strong>{a.title}</strong>
                {a.description ? <p>{a.description}</p> : null}
                {a.donor_name ? <p className="note">{a.donor_name}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No vehicles or property recorded yet.</p>
        )}
      </section>

      {offers.length ? (
        <div className="grid">
          {offers.map((offer) => (
            <article className="card" key={offer.id}>
              <span>{offer.kind}{offer.tenure ? ` · ${offer.tenure}` : ""}{offer.asset_kind ? ` · ${offer.asset_kind.replace("_", " ")}` : ""} · {offer.status}</span>
              <strong>{offer.title}</strong>
              {offer.description ? <p>{offer.description}</p> : null}
              {offer.quantity ? <p className="note">{offer.quantity}</p> : null}
              {offer.amount_cents ? (
                <p className="note">
                  ${(offer.amount_cents / 100).toFixed(0)}
                  {offer.description.includes("Stripe session")
                    ? offer.status === "received"
                      ? " · card received"
                      : " · card checkout started"
                    : " · recorded (Cash App / Venmo / Zelle / cash until you mark received)"}
                </p>
              ) : null}
              {offer.available_when ? <p>When: {offer.available_when}</p> : null}
              <p className="note">{offer.contact_name} {offer.contact_phone} {offer.contact_email}</p>
              <PostForm action={`/api/donations/${offer.id}`} submitLabel="Update">
                <select className="input" name="status" defaultValue={offer.status}>
                  <option value="offered">Offered</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="received">Received</option>
                  <option value="declined">Declined</option>
                </select>
                <input className="input" name="stewardNotes" defaultValue={offer.steward_notes} placeholder="Pantry notes" />
              </PostForm>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">No offers yet.</p>
      )}
    </main>
  );
}
