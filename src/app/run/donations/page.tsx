import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listAssets, listDonations, listPayMethods } from "@/lib/db/queries";
import { payHint, payLabel, type PayKind } from "@/lib/pay";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DonationsAdminPage() {
  const { pantry } = await requirePantryDesk("/run/donations");
  if (!pantry) redirect("/run");
  const offers = await listDonations(pantry.id);
  const assets = await listAssets(pantry.id);
  const methods = await listPayMethods(pantry.id).catch(() => []);
  const kinds: PayKind[] = ["venmo", "cashapp", "zelle", "cash"];

  return (
    <main className="shell">
      <p className="eyebrow">Gifts</p>
      <h1>Food, money, vehicles, and property</h1>
      <p className="note">Card gifts show as received after checkout. Cash App, Venmo, and Zelle only appear publicly when you post the real handle. Vehicles and buildings stay on the pantry's books. <a href="/run/receipts">Year-end receipts</a></p>
      <RunNav />

      <section className="panel">
        <h2>How neighbors can pay</h2>
        <p className="note">Post the real Cash App, Venmo, and Zelle. Do not invent a handle. A QR prints on Give for families who do not have a card.</p>
        {kinds.map((kind) => {
          const row = methods.find((m) => m.kind === kind);
          return (
            <PostForm key={kind} action="/api/pay-methods" submitLabel={`Save ${payLabel(kind)}`}>
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
