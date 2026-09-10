import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listAssets, listDonations } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DonationsAdminPage() {
  const { pantry } = await requirePantryDesk("/run/donations");
  if (!pantry) redirect("/run");
  const offers = await listDonations(pantry.id);
  const assets = await listAssets(pantry.id);

  return (
    <main className="shell">
      <p className="eyebrow">Gifts</p>
      <h1>Food, money, vehicles, and property</h1>
      <p className="note">Money rows are pledges until you actually have the gift. Vehicles and buildings stay on the pantry's books — donated, loaned, leased, rented, or owned.</p>
      <RunNav />

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
              {offer.amount_cents ? <p className="note">Pledge ${(offer.amount_cents / 100).toFixed(0)} — not charged in-app</p> : null}
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
