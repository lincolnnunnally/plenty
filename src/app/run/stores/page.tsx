import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listHouseholds, listStorePartners, listStoreVouchers } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function modeLabel(mode: string) {
  if (mode === "food_voucher") return "Named food list";
  if (mode === "dock_pickup") return "We pick up at the dock";
  return "Hold at the desk";
}

export default async function StorePartnersPage() {
  const { pantry } = await requirePantryDesk("/run/stores");
  if (!pantry) redirect("/run");
  const partners = await listStorePartners(pantry.id);
  const households = await listHouseholds(pantry.id);
  const vouchers = await listStoreVouchers(pantry.id);
  const activePartners = partners.filter((p) => p.status === "active" && p.pickup_mode !== "dock_pickup");

  return (
    <main className="shell">
      <p className="eyebrow">Store partners</p>
      <h1>In-store pickup cards</h1>
      <p className="lede">
        The store donates on paper. The household carries a Plenty card and collects at customer service.
        Extra purchase is never required — proximity does the rest.
      </p>
      <RunNav />

      <section className="panel">
        <h2>Add a grocery store</h2>
        <p className="note">Default is a hold at customer service. That is what most stores will take. A named food list is the other in-store option. Dock pickup stays available on Give.</p>
        <PostForm action="/api/store-partners" submitLabel="Save store">
          <label className="field"><span>Store name</span><input className="input" name="name" required placeholder="Vidalia Piggly Wiggly…" /></label>
          <label className="field"><span>Address</span><input className="input" name="address" /></label>
          <div className="grid">
            <label className="field"><span>City</span><input className="input" name="city" defaultValue={pantry.city} /></label>
            <label className="field"><span>State</span><input className="input" name="state" defaultValue={pantry.state || "GA"} /></label>
            <label className="field"><span>ZIP</span><input className="input" name="zip" defaultValue={pantry.zip} /></label>
          </div>
          <label className="field"><span>Manager name</span><input className="input" name="contactName" /></label>
          <label className="field"><span>Phone</span><input className="input" name="phone" /></label>
          <label className="field"><span>Email</span><input className="input" name="contactEmail" type="email" /></label>
          <label className="field">
            <span>How they give</span>
            <select className="input" name="pickupMode" defaultValue="hold_desk">
              <option value="hold_desk">Hold the food at customer service — families walk in with a card</option>
              <option value="food_voucher">Named food list — they collect listed items only</option>
              <option value="dock_pickup">We pick up at the dock instead</option>
            </select>
          </label>
          <label className="field"><span>Where they collect</span><input className="input" name="holdDesk" defaultValue="Customer service" /></label>
          <label className="field"><span>Hours for pickup</span><input className="input" name="hoursText" placeholder="Weekdays 9–6…" /></label>
          <label className="field"><span>Store PIN (4–8 digits, so they can mark a card collected)</span><input className="input" name="pin" inputMode="numeric" pattern="\d{4,8}" /></label>
          <label className="field"><span>Notes</span><input className="input" name="notes" /></label>
          <input type="hidden" name="status" value="active" />
        </PostForm>
      </section>

      <section className="panel">
        <h2>Partner stores</h2>
        {partners.length ? (
          <div className="grid">
            {partners.map((p) => (
              <article className="card" key={p.id}>
                <span>{p.status} · {modeLabel(p.pickup_mode)}</span>
                <strong>{p.name}</strong>
                <p>{[p.address, p.city, p.state].filter(Boolean).join(", ") || "Address not set"}</p>
                <p className="note">{p.hold_desk}{p.hours_text ? ` · ${p.hours_text}` : ""} · extra purchase off · PIN {p.pin_set ? "set" : "needed"}</p>
                {p.contact_name || p.phone ? <p className="note">{[p.contact_name, p.phone, p.contact_email].filter(Boolean).join(" · ")}</p> : null}
                <PostForm action={`/api/store-partners/${p.id}`} submitLabel="Update">
                  <select className="input" name="status" defaultValue={p.status}>
                    <option value="invited">Invited</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                  <select className="input" name="pickupMode" defaultValue={p.pickup_mode}>
                    <option value="hold_desk">Hold at the desk</option>
                    <option value="food_voucher">Named food list</option>
                    <option value="dock_pickup">Dock pickup</option>
                  </select>
                  <label className="field"><span>Hold desk</span><input className="input" name="holdDesk" defaultValue={p.hold_desk} /></label>
                  <label className="field"><span>Hours</span><input className="input" name="hoursText" defaultValue={p.hours_text} /></label>
                  <label className="field"><span>New PIN (leave blank to keep)</span><input className="input" name="pin" inputMode="numeric" /></label>
                </PostForm>
                {p.status === "active" && p.pickup_mode !== "dock_pickup" ? (
                  <a className="button" href={`/api/store-card?kind=hold-list&partnerId=${p.id}`}>Print today’s hold list</a>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No grocery partners yet. That is honest — add a store when a manager says yes.</p>
        )}
      </section>

      <section className="panel">
        <h2>Issue a store card</h2>
        {activePartners.length && households.length ? (
          <PostForm action="/api/store-vouchers" submitLabel="Issue card">
            <label className="field">
              <span>Household</span>
              <select className="input" name="householdId" required>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>{h.display_name} · {h.household_size} people</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Store</span>
              <select className="input" name="partnerId" required>
                {activePartners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} · {p.hold_desk}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>What is waiting (hold bag, or named items)</span>
              <input className="input" name="itemsText" placeholder="This week's produce hold, or: milk, bread, eggs" />
            </label>
            <label className="field">
              <span>Expires in days (blank = until collected)</span>
              <input className="input" name="expiresInDays" type="number" min={1} max={365} />
            </label>
          </PostForm>
        ) : (
          <p className="empty">
            {!households.length ? "No households yet." : "No active in-store partners yet."} Cards print after both exist.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Cards issued</h2>
        {vouchers.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Code</th><th>Household</th><th>Store</th><th>Hold</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td><a href={`/s/${v.code}`}>{v.code}</a></td>
                    <td>{v.household_name}</td>
                    <td>{v.partner_name}</td>
                    <td>{v.items_text || "This week's hold"}{v.expires_at ? ` · by ${new Date(v.expires_at).toLocaleDateString()}` : ""}</td>
                    <td>{v.status}{v.redeemed_at ? ` · ${new Date(v.redeemed_at).toLocaleDateString()}` : ""}</td>
                    <td>
                      <div className="action-row" style={{ marginTop: 0 }}>
                        {v.status === "issued" ? <a className="button" href={`/api/store-card?voucherId=${v.id}`}>Print card</a> : null}
                        {v.status === "issued" ? (
                          <PostForm action={`/api/store-vouchers/${v.id}`} submitLabel="Void">
                            <input type="hidden" name="status" value="void" />
                          </PostForm>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No store cards issued yet.</p>
        )}
      </section>
    </main>
  );
}
