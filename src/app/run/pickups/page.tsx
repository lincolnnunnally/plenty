import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantry, isSteward, listPickups } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PickupsPage() {
  const user = await requireCustomerAccess("/run/pickups");
  const pantry = await getDefaultPantry();
  if (!pantry) redirect("/run");
  if (!(await isSteward(pantry.id, user.id, user.role))) redirect("/app");
  const pickups = await listPickups(pantry.id);

  return (
    <main className="shell">
      <p className="eyebrow">Pantry desk</p>
      <h1>Pickups and deliveries</h1>
      <p className="lede">Donors ask us to pick up food. Families ask for a delivery. Confirm a time, then mark it done.</p>
      <RunNav />
      {pickups.length ? (
        <div className="grid">
          {pickups.map((p) => (
            <article className="card" key={p.id}>
              <span>{p.kind === "donation_pickup" ? "Pick up a donation" : "Deliver to a household"} · {p.status}</span>
              <strong>{p.address}</strong>
              <p>{p.contact_name} {p.contact_phone}</p>
              {p.scheduled_for ? <p>{new Date(p.scheduled_for).toLocaleString()}</p> : <p className="note">No time set yet</p>}
              {p.notes ? <p>{p.notes}</p> : null}
              {p.status === "requested" ? (
                <PostForm action="/api/pickups" submitLabel="Mark scheduled">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value="scheduled" />
                </PostForm>
              ) : null}
              {p.status === "scheduled" ? (
                <PostForm action="/api/pickups" submitLabel="Mark done">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value="done" />
                </PostForm>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">No pickup or delivery requests yet.</p>
      )}
    </main>
  );
}
