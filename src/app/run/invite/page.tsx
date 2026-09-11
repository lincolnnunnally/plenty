import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listedAllies, listHouseholds, visitCountsByHousehold } from "@/lib/db/queries";
import { canReach, zip5 } from "@/lib/invite";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BulkInvitePage() {
  const { pantry } = await requirePantryDesk("/run/invite");
  if (!pantry) redirect("/run");
  const households = await listHouseholds(pantry.id).catch(() => []);
  const visits = await visitCountsByHousehold(pantry.id).catch(() => new Map());
  const around = await listedAllies(pantry.id).catch(() => []);
  const reachable = households.filter(canReach);
  const zipCounts = new Map<string, { all: number; reach: number }>();
  for (const h of households) {
    const z = zip5(h.zip) || "no ZIP";
    const row = zipCounts.get(z) || { all: 0, reach: 0 };
    row.all += 1;
    if (canReach(h)) row.reach += 1;
    zipCounts.set(z, row);
  }
  const zips = [...zipCounts.entries()].sort((a, b) => b[1].all - a[1].all);

  return (
    <main className="shell">
      <p className="eyebrow">Invite</p>
      <h1>Bulk invite</h1>
      <p className="lede">Pick a ZIP, a few traits, or names. Only people who said texts are OK. Food stays free.</p>
      <RunNav />

      <section className="panel">
        <h2>Who to invite</h2>
        <p className="note">{reachable.length} opted in of {households.length} households. Count the list first. Then send.</p>
        <PostForm action="/api/invites" submitLabel="Count this list">
          <input type="hidden" name="audience" value="bulk" />
          <input type="hidden" name="preview" value="1" />
          <input type="hidden" name="kind" value="invite" />
          <label className="field">
            <span>Invite them to</span>
            <select className="input" name="placeId" defaultValue="hub">
              <option value="hub">{pantry.name}</option>
              {around.filter((a) => a.kind === "pantry" && a.relationship !== "closed").map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <p className="note">ZIP codes on file</p>
          <div className="chip-row">
            {zips.map(([z, n]) => (
              <label className="check" key={z}>
                <input type="checkbox" name="zips" value={z === "no ZIP" ? "" : z} disabled={z === "no ZIP"} /> {z} · {n.reach} can text / {n.all}
              </label>
            ))}
          </div>
          {zips.length === 0 ? <p className="empty">No households yet. They get a ZIP when they register.</p> : null}
          <p className="note">Or traits (combined with ZIP)</p>
          <label className="check"><input type="checkbox" name="children" /> Families with children</label>
          <label className="check"><input type="checkbox" name="delivery" /> Asked for delivery</label>
          <label className="check"><input type="checkbox" name="neverVisited" /> Never checked in</label>
          <label className="field">
            <span>Not seen in this many days (blank = ignore)</span>
            <input className="input" name="quietDays" type="number" min="0" placeholder="30" />
          </label>
          <label className="field">
            <span>Household size at least</span>
            <input className="input" name="minSize" type="number" min="0" placeholder="0" />
          </label>
          <p className="note">Or tick names. Leave them all off to use ZIP / traits only.</p>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th></th><th>Name</th><th>ZIP</th><th>Family</th><th>Visits</th><th>Texts</th></tr></thead>
              <tbody>
                {households.map((h) => {
                  const v = visits.get(h.id);
                  return (
                    <tr key={h.id}>
                      <td>{canReach(h) ? <input type="checkbox" name="householdIds" value={h.id} /> : null}</td>
                      <td>{h.display_name}</td>
                      <td>{zip5(h.zip) || "—"}</td>
                      <td>{h.household_size}{h.children_count ? ` · ${h.children_count} kids` : ""}{h.delivery_ok ? " · delivery" : ""}</td>
                      <td>{v ? `${v.count}${v.lastVisit ? ` · ${new Date(v.lastVisit).toLocaleDateString()}` : ""}` : "0"}</td>
                      <td>{canReach(h) ? "OK" : "off"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PostForm>
      </section>

      <section className="panel">
        <h2>Send after you count</h2>
        <p className="note">Same cuts as above. This actually texts. Twilio has to be on.</p>
        <PostForm action="/api/invites" submitLabel="Send invite">
          <input type="hidden" name="audience" value="bulk" />
          <input type="hidden" name="kind" value="invite" />
          <label className="field">
            <span>Invite them to</span>
            <select className="input" name="placeId" defaultValue="hub">
              <option value="hub">{pantry.name}</option>
              {around.filter((a) => a.kind === "pantry" && a.relationship !== "closed").map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <div className="chip-row">
            {zips.filter(([z]) => z !== "no ZIP").map(([z, n]) => (
              <label className="check" key={z}><input type="checkbox" name="zips" value={z} /> {z} ({n.reach})</label>
            ))}
          </div>
          <label className="check"><input type="checkbox" name="children" /> Families with children</label>
          <label className="check"><input type="checkbox" name="delivery" /> Asked for delivery</label>
          <label className="check"><input type="checkbox" name="neverVisited" /> Never checked in</label>
          <label className="field"><span>Not seen in this many days</span><input className="input" name="quietDays" type="number" min="0" /></label>
          <label className="field"><span>Household size at least</span><input className="input" name="minSize" type="number" min="0" /></label>
          <p className="note">Tick names to send only those people (still must have texts OK).</p>
          {reachable.map((h) => (
            <label className="check" key={h.id}><input type="checkbox" name="householdIds" value={h.id} /> {h.display_name}{h.zip ? ` · ${zip5(h.zip)}` : ""}</label>
          ))}
        </PostForm>
      </section>
    </main>
  );
}
