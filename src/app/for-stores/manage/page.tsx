import { PostForm } from "@/components/post-form";
import { listFoodLoads } from "@/lib/db/food-loads";
import { getDefaultPantrySafe, listStorePartners } from "@/lib/db/queries";
import { storeDeskPartnerId } from "@/lib/store-card/store-session";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Store desk — change how you give",
  "Grocery stores working with Plenty can change dock pickup, desk hold, or volunteers on the floor, and tell us when to collect food."
);

function howValue(p: { pickup_mode: string; volunteers_on_site: boolean }) {
  if (p.pickup_mode === "dock_pickup") return "dock_pickup";
  if (p.volunteers_on_site) return "store_meet";
  return "hold_desk";
}

export default async function StoreManagePage() {
  const pantry = await getDefaultPantrySafe();
  const partners = pantry ? await listStorePartners(pantry.id).catch(() => []) : [];
  const active = partners.filter((p) => p.status === "active");
  const partnerId = await storeDeskPartnerId();
  const partner = active.find((p) => p.id === partnerId) || null;
  const loads = pantry && partner ? await listFoodLoads(pantry.id, { partnerId: partner.id }).catch(() => []) : [];

  return (
    <main className="shell">
      <p className="eyebrow">Grocery store desk</p>
      <h1>You choose. You can change it.</h1>
      <p className="lede">
        Dock pickup, a bag at customer service, or volunteers on your floor. If managers change, change the option.
        If you have more food than people, tell us — we will collect it.
      </p>

      {!partner ? (
        <section className="panel">
          <h2>Open with your store PIN</h2>
          {active.length ? (
            <PostForm action="/api/store-desk/login" submitLabel="Open store desk">
              <label className="field">
                <span>Store</span>
                <select className="input" name="partnerId" required>
                  {active.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label className="field"><span>PIN Plenty gave this store</span><input className="input" name="pin" inputMode="numeric" required autoComplete="off" /></label>
            </PostForm>
          ) : (
            <p className="empty">No active store partners yet. Ask Plenty to add you first.</p>
          )}
        </section>
      ) : (
        <>
          <section className="panel">
            <h2>{partner.name}</h2>
            <p className="note">Current option: {howValue(partner) === "dock_pickup" ? "A — we pick up at the dock" : howValue(partner) === "store_meet" ? "C — volunteers meet families here" : "B — hold at customer service"}</p>
            <PostForm action="/api/store-desk/option" submitLabel="Change option">
              <label className="field">
                <span>How you want to give</span>
                <select className="input" name="how" defaultValue={howValue(partner)}>
                  <option value="dock_pickup">A — Pick up at our dock</option>
                  <option value="hold_desk">B — Hold a bag at customer service (no volunteers on the floor)</option>
                  <option value="store_meet">C — Plenty volunteers may meet families here</option>
                </select>
              </label>
              <label className="field"><span>Hours people may come (B and C — especially for cold food)</span><input className="input" name="hoursText" defaultValue={partner.hours_text} /></label>
              <label className="field"><span>Where the hold sits</span><input className="input" name="holdDesk" defaultValue={partner.hold_desk} /></label>
              <label className="field"><span>How to find a volunteer (C)</span><input className="input" name="meetNote" defaultValue={partner.meet_note} /></label>
            </PostForm>
          </section>

          <section className="panel">
            <h2>{howValue(partner) === "dock_pickup" ? "Schedule a pickup" : "Food ready — or leftover to collect"}</h2>
            <p className="note">
              Tell us what it is (dry, cold, frozen, produce) and when. We post a volunteer shift and pick a pantry, or a farm/compost if people cannot eat it in time.
            </p>
            <PostForm action="/api/store-desk/load" submitLabel="Send this to Plenty">
              {howValue(partner) !== "dock_pickup" ? (
                <label className="check"><input type="checkbox" name="leftover" value="1" /> This is leftover — more food than people came. Please collect it.</label>
              ) : null}
              <label className="field"><span>Pick up at</span><input className="input" type="datetime-local" name="pickupAt" /></label>
              {howValue(partner) !== "dock_pickup" ? (
                <label className="field"><span>Hold cannot sit past (cold food)</span><input className="input" type="datetime-local" name="holdUntil" /></label>
              ) : null}
              <label className="field"><span>Dry goods</span><input className="input" name="dryQty" placeholder="quantity / what" /></label>
              <label className="field"><span>Refrigerated</span><input className="input" name="refrigeratedQty" /></label>
              <label className="field"><span>Use refrigerated by</span><input className="input" type="date" name="refrigeratedBy" /></label>
              <label className="field"><span>Frozen</span><input className="input" name="frozenQty" /></label>
              <label className="field"><span>Produce</span><input className="input" name="produceQty" /></label>
              <label className="field"><span>Use produce by</span><input className="input" type="date" name="produceBy" /></label>
              <label className="field"><span>Notes</span><input className="input" name="notes" /></label>
            </PostForm>
          </section>

          <section className="panel">
            <h2>What we are doing with your food</h2>
            {loads.length ? (
              <div className="table-scroll">
                <table className="table">
                  <thead><tr><th>When</th><th>What</th><th>Where it is going</th><th>Status</th></tr></thead>
                  <tbody>
                    {loads.map((l) => (
                      <tr key={l.id}>
                        <td>{l.pickup_at ? new Date(l.pickup_at).toLocaleString() : "—"}</td>
                        <td>{(l.items || []).map((i) => i.category).join(", ") || "—"}{l.leftover ? " · leftover" : ""}</td>
                        <td>{l.dest_name}{l.route_reason ? ` · ${l.route_reason}` : ""}</td>
                        <td>{l.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty">No food scheduled yet.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
