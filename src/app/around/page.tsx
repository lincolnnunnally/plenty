import { AroundPlace } from "@/components/around-place";
import { PantryMap } from "@/components/pantry-map";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdminEmail } from "@/lib/auth/roles";
import { coordsForName, type MapPlace } from "@/lib/maps";
import { ensureToombsStartingPoints, getDefaultPantrySafe, isSteward, listAllies, listedAllies } from "@/lib/db/queries";
import { alliesForOperator } from "@/lib/db/food-loads";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Food pantries in Vidalia and Lyons",
  "Plenty lists food pantries in Toombs County only after someone walks in. Hours are what we saw, not what a directory guessed."
);

function pin(a: { id: string; name: string; address: string; city: string; state?: string; zip?: string; hours_text?: string; relationship: string }): MapPlace | null {
  const coords = coordsForName(a.name);
  if (!coords || !a.address) return null;
  return {
    id: a.id,
    name: a.name,
    address: a.address,
    city: a.city,
    state: a.state || "GA",
    zip: a.zip,
    hours: a.hours_text,
    status: a.relationship === "closed" ? "closed" : a.relationship === "to_meet" ? "unconfirmed" : "open",
    lat: coords.lat,
    lon: coords.lon
  };
}

function publicCard(
  a: {
    id: string;
    name: string;
    kind: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    hours_text: string;
    visit_notes: string;
    contact_name: string;
    relationship: string;
    listed_publicly: boolean;
    last_visited_at: string | null;
    operator_pantry_id: string | null;
  },
  desk: boolean
) {
  return {
    id: a.id,
    name: a.name,
    kind: a.kind,
    address: a.address,
    city: a.city,
    state: a.state,
    zip: a.zip,
    phone: a.phone,
    hours_text: a.hours_text,
    visit_notes: desk || a.relationship === "closed" ? a.visit_notes : "",
    contact_name: desk ? a.contact_name : "",
    relationship: a.relationship,
    listed_publicly: a.listed_publicly,
    last_visited_at: a.last_visited_at,
    operator_pantry_id: a.operator_pantry_id
  };
}

export default async function AroundPage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  if (pantry) await ensureToombsStartingPoints(pantry.id).catch(() => 0);
  const steward = Boolean(
    user && pantry && (isSuperAdminEmail(user.email) || (await isSteward(pantry.id, user.id, user.email).catch(() => false)))
  );
  const operated = user && pantry ? await alliesForOperator(pantry.id, user.id).catch(() => []) : [];
  const operatedIds = new Set(operated.map((a) => a.id));
  const listed = pantry ? await listedAllies(pantry.id).catch(() => []) : [];
  const all = steward && pantry ? await listAllies(pantry.id).catch(() => listed) : listed;
  const open = listed.filter((a) => a.kind === "pantry" && a.relationship !== "closed");
  const closed = listed.filter((a) => a.relationship === "closed");
  const toCheck = steward
    ? all.filter((a) => a.kind === "pantry" && a.relationship === "to_meet" && a.address)
    : [];
  const pins = [...open, ...closed, ...toCheck].map(pin).filter((p): p is MapPlace => Boolean(p));

  return (
    <main className="shell">
      <p className="eyebrow">Toombs County · Vidalia and Lyons</p>
      <h1>Food pantries we have checked</h1>
      <p className="lede">Hours only after someone walked in. Tap Drive to open Maps. If a building is empty, we say so.</p>

      <PantryMap places={pins} />

      {open.length ? (
        <section className="panel">
          <h2>Open</h2>
          <div className="grid">
            {open.map((a) => (
              <AroundPlace
                key={a.id}
                place={publicCard(a, steward || operatedIds.has(a.id))}
                canEdit={steward || operatedIds.has(a.id)}
                canClaim={!a.operator_pantry_id}
                signedIn={Boolean(user)}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="empty">No other pantry confirmed in person yet.</p>
      )}

      {closed.length ? (
        <section className="panel">
          <h2>Do not go here</h2>
          <div className="grid">
            {closed.map((a) => (
              <AroundPlace key={a.id} place={publicCard(a, steward)} closed canEdit={steward} signedIn={Boolean(user)} />
            ))}
          </div>
        </section>
      ) : null}

      {toCheck.length ? (
        <section className="panel">
          <h2>Still to check</h2>
          <p className="note">Directory names. Drive there, then save what the door says.</p>
          <div className="grid">
            {toCheck.map((a) => (
              <AroundPlace key={a.id} place={publicCard(a, true)} canEdit canClaim={!a.operator_pantry_id} signedIn={Boolean(user)} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>Run a pantry on Plenty</h2>
        <p>
          If this is your pantry, claim it. Post hours, who you serve, when you need volunteers, and ask us for grocery food.
        </p>
        <div className="action-row">
          <a className="button primary" href={user ? "/serve" : "/sign-in?next=/around"}>
            {user ? "Your pantry desk" : "Create an account to claim"}
          </a>
          {steward ? <a className="button" href="/run/around">Full visit list</a> : null}
        </div>
      </section>

      <p className="note">
        Need groceries from Plenty? <a href="/need-food">Get food</a>.
        {" "}Want to help? <a href="/volunteer">Volunteer</a>.
      </p>
    </main>
  );
}
