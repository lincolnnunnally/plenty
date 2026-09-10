import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listHouseholds, listRecurring, listStorePartners, listStoreVouchers } from "@/lib/db/queries";
import { FOOD_TYPES, WEEKDAYS, concernLabels, parseConcerns, parseFoodNote, weekdayName } from "@/lib/store-pitch";
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
  const jobs = await listRecurring(pantry.id).catch(() => []);
  const activePartners = partners.filter((p) => p.status === "active" && p.pickup_mode !== "dock_pickup");
  const maybes = partners.filter((p) => p.status === "invited");

  return (
    <main className="shell">
      <p className="eyebrow">Store partners</p>
      <h1>Grocery stores</h1>
      <p className="lede">Weekly leftover pickup posts a shift, texts pickup volunteers, and routes the food.</p>
      <RunNav />

      <section className="panel">
        <h2>Add a store + weekly pickup</h2>
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
            <select className="input" name="pickupMode" defaultValue="dock_pickup">
              <option value="dock_pickup">We pick up at the dock</option>
              <option value="hold_desk">Hold the food at customer service</option>
              <option value="food_voucher">Named food list</option>
            </select>
          </label>
          <div className="grid">
            <label className="field">
              <span>Weekly pickup day</span>
              <select className="input" name="weekday" defaultValue="5">
                {WEEKDAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </label>
            <label className="field"><span>Time</span><input className="input" name="timeLocal" type="time" defaultValue="18:00" /></label>
          </div>
          <p className="note">Usually on the dock</p>
          <div className="chip-row">
            {FOOD_TYPES.map((t) => (
              <label className="check" key={t.value}><input type="checkbox" name="foodTypes" value={t.value} defaultChecked={t.value === "dry"} /> {t.label}</label>
            ))}
          </div>
          <label className="field"><span>Where they collect (if desk hold)</span><input className="input" name="holdDesk" defaultValue="Customer service" /></label>
          <label className="field"><span>Store PIN (4–8 digits)</span><input className="input" name="pin" inputMode="numeric" pattern="\d{4,8}" /></label>
          <input type="hidden" name="volunteersOnSite" value="0" />
          <label className="check"><input type="checkbox" name="volunteersOnSite" value="1" /> Store asked: volunteers may meet families here</label>
          <label className="field"><span>How to find the volunteer</span><input className="input" name="meetNote" placeholder="Green apron at customer service" /></label>
          <input type="hidden" name="status" value="active" />
        </PostForm>
      </section>

      <section className="panel">
        <h2>Need a call · {maybes.length}</h2>
        <p className="note">They asked to donate. They may not be ready for a weekly dock yet. Call the manager.</p>
        {maybes.length ? (
          <div className="grid">
            {maybes.map((p) => {
              const worries = concernLabels(parseConcerns(p.notes));
              return (
                <article className="card" key={p.id}>
                  <span>Not weekly yet</span>
                  <strong>{p.name}</strong>
                  <p>{[p.contact_name, p.phone, p.contact_email].filter(Boolean).join(" · ") || "No contact"}</p>
                  {worries.length ? <p className="note">Concerns: {worries.join(" · ")}</p> : null}
                  {p.notes ? <p className="note">{p.notes.replace(/food:[a-z,]+/gi, "").replace(/concerns:[a-z,]+/gi, "").trim()}</p> : null}
                  {p.phone ? <a className="button" href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}>Call</a> : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty">No open store asks.</p>
        )}
      </section>

      <section className="panel">
        <h2>Partner stores</h2>
        {partners.length ? (
          <div className="grid">
            {partners.map((p) => {
              const weekly = jobs.filter((j) => j.kind === "store_pickup" && j.partner_id === p.id);
              return (
                <article className="card" key={p.id}>
                  <span>{p.status} · {modeLabel(p.pickup_mode)}</span>
                  <strong>{p.name}</strong>
                  <p>{[p.address, p.city, p.state].filter(Boolean).join(", ") || "Address not set"}</p>
                  <p className="note">{p.hold_desk}{p.hours_text ? ` · ${p.hours_text}` : ""}{p.volunteers_on_site ? " · volunteers meet families" : ""}</p>
                  {p.contact_name || p.phone ? <p className="note">{[p.contact_name, p.phone, p.contact_email].filter(Boolean).join(" · ")}</p> : null}
                  {concernLabels(parseConcerns(p.notes)).length ? (
                    <p className="note">Concerns: {concernLabels(parseConcerns(p.notes)).join(" · ")}</p>
                  ) : null}
                  {weekly.length ? (
                    <ul>
                      {weekly.map((j) => (
                        <li key={j.id}>
                          {weekdayName(j.weekday)} {j.time_local} · {parseFoodNote(j.notes).join(", ")} · {j.active ? "repeating" : "stopped"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="note">No weekly pickup yet.</p>
                  )}
                  <h3 style={{ marginTop: 16 }}>Weekly leftover pickup</h3>
                  <PostForm action="/api/recurring" submitLabel="Repeat this pickup">
                    <input type="hidden" name="kind" value="store_pickup" />
                    <input type="hidden" name="partnerId" value={p.id} />
                    <input type="hidden" name="title" value={`Pickup at ${p.name}`} />
                    <input type="hidden" name="role" value="pickup" />
                    <input type="hidden" name="location" value={[p.address, p.city].filter(Boolean).join(", ")} />
                    <div className="grid">
                      <label className="field">
                        <span>Day</span>
                        <select className="input" name="weekday" defaultValue="5">
                          {WEEKDAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </label>
                      <label className="field"><span>Time</span><input className="input" name="timeLocal" type="time" defaultValue="18:00" required /></label>
                    </div>
                    <div className="chip-row">
                      {FOOD_TYPES.map((t) => (
                        <label className="check" key={t.value}><input type="checkbox" name="foodTypes" value={t.value} defaultChecked={t.value === "dry"} /> {t.label}</label>
                      ))}
                    </div>
                  </PostForm>
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
                    <input type="hidden" name="volunteersOnSite" value="0" />
                    <label className="check"><input type="checkbox" name="volunteersOnSite" value="1" defaultChecked={p.volunteers_on_site} /> Store chose: volunteers meet families here</label>
                    <label className="field"><span>How to find the volunteer</span><input className="input" name="meetNote" defaultValue={p.meet_note} /></label>
                    <label className="field"><span>New PIN (leave blank to keep)</span><input className="input" name="pin" inputMode="numeric" /></label>
                  </PostForm>
                  {p.status === "active" && p.pickup_mode !== "dock_pickup" ? (
                    <a className="button" href={`/api/store-card?kind=hold-list&partnerId=${p.id}`}>Print today’s hold list</a>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty">No grocery partners yet.</p>
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
              <span>What is in this bag</span>
              <input className="input" name="itemsText" placeholder="Chicken, rice, apples — or leave blank" />
            </label>
            <label className="field">
              <span>They may still want (optional)</span>
              <input className="input" name="stillNeedText" placeholder="Milk, eggs, soap" />
            </label>
            <label className="field">
              <span>Expires in days (blank = until collected)</span>
              <input className="input" name="expiresInDays" type="number" min={1} max={365} />
            </label>
          </PostForm>
        ) : (
          <p className="empty">
            {!households.length ? "No households yet." : "No active in-store partners yet."}
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
                        {v.status === "issued" ? <a className="button" href={`/api/store-card?kind=slip&voucherId=${v.id}`}>Bag slip</a> : null}
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
