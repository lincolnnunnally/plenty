import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantry, isSteward, listDonations } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DonationsAdminPage() {
  const user = await requireCustomerAccess("/run/donations");
  const pantry = await getDefaultPantry();
  if (!pantry) redirect("/run");
  if (!(await isSteward(pantry.id, user.id, user.role))) redirect("/app");
  const offers = await listDonations(pantry.id);

  return (
    <main className="shell">
      <p className="eyebrow">Offers</p>
      <h1>Food, money, space, vehicles</h1>
      <p className="note">Money rows are pledges. Do not mark received until you actually have the gift in hand.</p>
      <RunNav />

      {offers.length ? (
        <div className="grid">
          {offers.map((offer) => (
            <article className="card" key={offer.id}>
              <span>{offer.kind} · {offer.status}</span>
              <strong>{offer.title}</strong>
              {offer.description ? <p>{offer.description}</p> : null}
              {offer.quantity ? <p className="note">{offer.quantity}</p> : null}
              {offer.amount_cents ? <p className="note">Pledge ${ (offer.amount_cents / 100).toFixed(0) } — not charged in-app</p> : null}
              {offer.available_when ? <p>When: {offer.available_when}</p> : null}
              <p className="note">{offer.contact_name} {offer.contact_phone} {offer.contact_email}</p>
              <PostForm action={`/api/donations/${offer.id}`} submitLabel="Update">
                <select className="input" name="status" defaultValue={offer.status}>
                  <option value="offered">Offered</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="received">Received</option>
                  <option value="declined">Declined</option>
                </select>
                <input className="input" name="stewardNotes" defaultValue={offer.steward_notes} placeholder="Steward notes" />
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
