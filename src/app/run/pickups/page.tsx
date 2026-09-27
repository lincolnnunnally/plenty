import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listPickupEmails, listPickupRoutes, type PickupEmailRow } from "@/lib/db/pickup-desk";
import { listAllies, listLocations, listPickups, listVolunteers, type Pickup } from "@/lib/db/queries";
import { hasCooler } from "@/lib/cooler";
import {
  PICKUP_KIND_LABELS,
  PICKUP_ROUTE_KINDS,
  WEEKDAY_LABELS,
  matchingRouteEmails,
  pickupDeliverLine,
  pickupFromLine,
  planNoticeRecipients
} from "@/lib/pickup-routes";
import { formatEasternWhen, groupPickups, pickupIsOverdue } from "@/lib/pickup-watch";
import { easternLocalInput } from "@/lib/schedule";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PickupsPage() {
  const { pantry } = await requirePantryDesk("/run/pickups");
  if (!pantry) {
    redirect("/run");
    return null;
  }
  const desk = pantry;
  const now = new Date();
  const [pickups, volunteers, routes, emails, allies, locations] = await Promise.all([
    listPickups(desk.id),
    listVolunteers(desk.id),
    listPickupRoutes(desk.id),
    listPickupEmails(desk.id),
    listAllies(desk.id).catch(() => []),
    listLocations(desk.id).catch(() => [])
  ]);
  const groups = groupPickups(pickups, now);
  const drivers = volunteers.filter((v) => v.roles.includes("delivery") || v.has_vehicle);
  const coldDrivers = drivers.filter((v) => hasCooler(v.notes));
  const driverName = new Map(volunteers.map((v) => [v.user_id, v.name || v.email || "Assigned"]));
  const openCount = groups.needsScheduling.length + groups.upcoming.length + groups.overdue.length;
  const allyName = new Map(allies.map((ally) => [ally.id, ally.name]));
  const locationName = new Map(locations.map((place) => [place.id, [place.name, place.address].filter(Boolean).join(" · ")]));
  const mailByPickup = new Map<string, PickupEmailRow[]>();
  for (const mail of emails.rows) {
    if (!mail.pickup_id) continue;
    const list = mailByPickup.get(mail.pickup_id) || [];
    list.push(mail);
    mailByPickup.set(mail.pickup_id, list);
  }
  const pantryLabel = [desk.name, desk.address].filter(Boolean).join(" · ");

  function cards(rows: Pickup[], flagOverdue: boolean) {
    return (
      <div className="grid">
        {rows.map((p) => {
          const assignee = p.assigned_user_id ? driverName.get(p.assigned_user_id) || "Assigned" : "Unassigned";
          const matched = matchingRouteEmails(routes.rows, { kind: p.kind, scheduledFor: p.scheduled_for });
          const history = mailByPickup.get(p.id) || [];
          const sentTo = [...new Set(history.map((mail) => mail.to_email.trim().toLowerCase()).filter(Boolean))];
          const planned = planNoticeRecipients("new", matched).to.map((email) => {
            const label = routes.rows.find((route) => route.email.trim().toLowerCase() === email)?.label.trim();
            return label ? `${label} · ${email}` : email;
          });
          const recipients = sentTo.length ? sentTo : planned;
          const deliverTo = pickupDeliverLine(p, {
            ally: p.dest_ally_id ? allyName.get(p.dest_ally_id) : "",
            location: p.dest_location_id ? locationName.get(p.dest_location_id) : "",
            pantry: pantryLabel
          });
          return (
            <article className="card" key={p.id}>
              <span>{PICKUP_KIND_LABELS[p.kind] || p.kind.replace(/_/g, " ")} · {p.status} · Driver: {assignee}</span>
              {flagOverdue && pickupIsOverdue(p, now) ? <p className="note error">Overdue — the time passed and this is still open.</p> : null}
              <dl className="pickup-facts">
                <div><dt>From</dt><dd>{pickupFromLine(p, desk)}</dd></div>
                <div><dt>Deliver to</dt><dd>{deliverTo}</dd></div>
                <div><dt>When</dt><dd>{formatEasternWhen(p.scheduled_for, p.window_text)}</dd></div>
                <div><dt>Items</dt><dd>{p.items_text || p.notes || "Not listed"}{p.pounds ? ` · ${p.pounds} lb` : ""}</dd></div>
                <div><dt>Donor contact</dt><dd>{[p.contact_name, p.contact_phone].filter(Boolean).join(" · ") || "Not listed"}</dd></div>
                {p.notes && p.notes !== p.items_text ? <div><dt>Notes</dt><dd>{p.notes}</dd></div> : null}
                <div><dt>{sentTo.length ? "Sent to" : "Routed to"}</dt><dd>{recipients.join(", ") || "lincoln@unitedundergod.org"}</dd></div>
              </dl>
              {p.kind === "household_delivery" ? (
                <p className="note">
                  {p.will_be_home === true ? "Someone will be home." : p.will_be_home === false ? "May not be home." : "Home status not set."}
                  {p.porch_leave_ok ? " OK to leave on the porch." : " Do not leave on the porch unless you hear from them."}
                </p>
              ) : null}
              {history.length ? (
                <ul className="mail-log">
                  {history.map((mail) => (
                    <li key={mail.id}>
                      {mail.kind} · {mail.to_email} · {new Date(mail.created_at).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {mail.status}{mail.error ? ` · ${mail.error}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="note">{emails.ready ? "No email logged for this pickup yet." : "Email history appears after the log table is applied."}</p>
              )}
              <PostForm action="/api/pickups" submitLabel="Save pickup details">
                <input type="hidden" name="id" value={p.id} />
                {p.assigned_user_id ? <input type="hidden" name="assignedUserId" value={p.assigned_user_id} /> : null}
                <label className="field"><span>{p.kind === "household_delivery" ? "Household address" : "From address"}</span><input className="input" name="address" defaultValue={p.address} required /></label>
                <label className="field"><span>When (Eastern)</span><input className="input" type="datetime-local" name="scheduledFor" defaultValue={easternLocalInput(p.scheduled_for)} /></label>
                {p.kind === "household_delivery" ? null : (
                  <>
                    <label className="field">
                      <span>Deliver to an ally</span>
                      <select className="input" name="destAllyId" defaultValue={p.dest_ally_id || ""}>
                        <option value="">Pantry or a note below</option>
                        {allies.map((ally) => <option key={ally.id} value={ally.id}>{ally.name}</option>)}
                      </select>
                    </label>
                    <label className="field">
                      <span>Or a pantry place</span>
                      <select className="input" name="destLocationId" defaultValue={p.dest_location_id || ""}>
                        <option value="">No specific place</option>
                        {locations.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
                      </select>
                    </label>
                    <label className="field"><span>Deliver-to note</span><input className="input" name="destNote" defaultValue={p.dest_note} /></label>
                  </>
                )}
                <label className="field"><span>Items</span><input className="input" name="itemsText" defaultValue={p.items_text} /></label>
                <label className="field"><span>Pounds</span><input className="input" name="pounds" type="number" min="0" step="0.1" defaultValue={p.pounds ?? ""} /></label>
                <label className="field"><span>Note</span><input className="input" name="notes" defaultValue={p.notes} /></label>
              </PostForm>
              {p.status === "requested" || p.status === "needs_scheduling" ? (
                <PostForm action="/api/pickups" submitLabel="Schedule this">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value="scheduled" />
                  <label className="field"><span>Time (Eastern)</span><input className="input" type="datetime-local" name="scheduledFor" /></label>
                  {drivers.length ? (
                    <label className="field">
                      <span>Assign a driver</span>
                      <select className="input" name="assignedUserId">
                        <option value="">Unassigned</option>
                        {drivers.map((d) => <option key={d.user_id} value={d.user_id}>{d.name || d.email}{hasCooler(d.notes) ? " · cooler" : ""}</option>)}
                      </select>
                    </label>
                  ) : null}
                </PostForm>
              ) : null}
              {p.status === "scheduled" ? (
                <PostForm action="/api/pickups" submitLabel="Mark done">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value="done" />
                </PostForm>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <main className="shell pickup-desk">
      <p className="eyebrow">Pantry desk</p>
      <h1>Pickups and home deliveries</h1>
      <p className="lede">Confirm a time, know if someone will be home, and whether we may leave food on the porch.{coldDrivers.length ? ` ${coldDrivers.length} volunteer${coldDrivers.length === 1 ? " has" : "s have"} a cooler.` : " Nobody has checked that they can keep food cold yet."}</p>
      <RunNav />
      {groups.needsScheduling.length ? (
        <section className="panel">
          <h2>Needs scheduling</h2>
          <p className="note">No confirmed date yet. A window phrase still needs a time so someone can show up.</p>
          {cards(groups.needsScheduling, false)}
        </section>
      ) : null}
      <section className="panel">
        <h2>Upcoming pickups</h2>
        <p className="note">Soonest first. A request with no confirmed time is listed above, under Needs scheduling.</p>
        {groups.upcoming.length ? cards(groups.upcoming, false) : (
          <p className="empty">{openCount ? "Nothing dated ahead." : "No open pickups. A store, donor, or household request will show here."}</p>
        )}
      </section>
      {groups.overdue.length ? (
        <section className="panel">
          <h2>Overdue</h2>
          <p className="note">The time has passed and nobody has marked these done or cancelled.</p>
          {cards(groups.overdue, true)}
        </section>
      ) : null}
      {groups.finished.length ? (
        <section className="panel">
          <h2>Finished</h2>
          <div className="grid">
            {groups.finished.map((p) => (
              <article className="card" key={p.id}>
                <span>{p.status} · {p.assigned_user_id ? driverName.get(p.assigned_user_id) || "Assigned" : "Unassigned"}</span>
                <strong>{p.address}</strong>
                <p>{formatEasternWhen(p.scheduled_for, p.window_text)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section className="panel">
        <h2>Who gets the email</h2>
        <p className="note">
          {routes.ready
            ? "Add an address for a pickup type and a day. Any matches every type or every day. Several rows mean several people. If nothing matches, Lincoln still gets the mail."
            : "The routes table is not on this database yet. New requests, reminders, and overdue notes still go to Lincoln."}
        </p>
        {routes.rows.length ? (
          <ul className="mail-log">
            {routes.rows.map((route) => (
              <li key={route.id}>
                {route.label || route.email} · {route.email} · {PICKUP_KIND_LABELS[route.kind] || route.kind} · {WEEKDAY_LABELS[route.weekday] || route.weekday}
                <PostForm action="/api/pickup-routes" submitLabel="Remove">
                  <input type="hidden" name="id" value={route.id} />
                  <input type="hidden" name="remove" value="1" />
                </PostForm>
              </li>
            ))}
          </ul>
        ) : null}
        {routes.ready ? (
          <PostForm action="/api/pickup-routes" submitLabel="Add address">
            <label className="field"><span>Email</span><input className="input" type="email" name="email" required /></label>
            <label className="field"><span>Label, optional</span><input className="input" name="label" placeholder="Tuesday grocery crew" /></label>
            <label className="field">
              <span>Pickup type</span>
              <select className="input" name="kind" defaultValue="any">
                {PICKUP_ROUTE_KINDS.map((kind) => <option key={kind} value={kind}>{PICKUP_KIND_LABELS[kind]}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Day</span>
              <select className="input" name="weekday" defaultValue="any">
                {Object.entries(WEEKDAY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </PostForm>
        ) : null}
      </section>
    </main>
  );
}
