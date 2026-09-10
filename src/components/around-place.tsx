"use client";

import { PostForm } from "@/components/post-form";
import { DriveLink } from "@/components/drive-link";
import { coordsForName } from "@/lib/maps";

type Place = {
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
};

export function AroundPlace({
  place,
  closed = false,
  canEdit = false,
  canClaim = false,
  signedIn = false
}: {
  place: Place;
  closed?: boolean;
  canEdit?: boolean;
  canClaim?: boolean;
  signedIn?: boolean;
}) {
  const coords = coordsForName(place.name);
  return (
    <article className="card">
      <span>
        {closed ? "Closed or moved" : place.city}
        {place.last_visited_at ? ` · ${new Date(place.last_visited_at).toLocaleDateString()}` : ""}
      </span>
      <strong>{place.name}</strong>
      {place.address ? <p>{place.address}{place.city ? `, ${place.city}` : ""}</p> : null}
      {closed ? (
        <p>{place.visit_notes || place.hours_text || "Building empty or moved."}</p>
      ) : place.hours_text ? (
        <p>{place.hours_text}</p>
      ) : (
        <p className="note">Call for hours.</p>
      )}
      <div className="action-row">
        <DriveLink
          address={place.address}
          city={place.city}
          state={place.state || "GA"}
          zip={place.zip}
          lat={coords?.lat}
          lon={coords?.lon}
        />
        {place.phone ? (
          <a className="button" href={`tel:${place.phone.replace(/[^\d+]/g, "")}`}>
            Call
          </a>
        ) : null}
        {canClaim && !place.operator_pantry_id ? (
          signedIn ? (
            <PostForm className="claim-form" action={`/api/allies/${place.id}/claim`} submitLabel="This is my pantry" successHref="/run">
              <input type="hidden" name="claim" value="1" />
              <label className="field">
                <span>Type the pantry name</span>
                <input className="input" name="confirmName" required placeholder={place.name} />
              </label>
            </PostForm>
          ) : (
            <a className="button" href={`/sign-in?next=/around`}>
              Claim this pantry
            </a>
          )
        ) : null}
        {place.operator_pantry_id ? <a className="button" href="/run">Manage</a> : null}
      </div>
      {canEdit ? (
        <details className="field-edit">
          <summary>Update from the door</summary>
          <PostForm action={`/api/allies/${place.id}`} submitLabel="Save what you saw">
            <label className="field">
              <span>Hours on the door</span>
              <input className="input" name="hoursText" defaultValue={place.hours_text} placeholder="Mon–Wed 10 a.m.–2 p.m." />
            </label>
            <label className="field">
              <span>Address</span>
              <input className="input" name="address" defaultValue={place.address} />
            </label>
            <label className="field">
              <span>People (desk only — not on the public card)</span>
              <textarea className="input" name="contactName" defaultValue={place.contact_name} placeholder="Kevin — hours. Billy, associate pastor…" />
            </label>
            <label className="field">
              <span>What you saw</span>
              <textarea className="input" name="visitNotes" defaultValue={place.visit_notes} />
            </label>
            <input type="hidden" name="markVisited" value="1" />
            <input type="hidden" name="listedPublicly" value="0" />
            <label className="check">
              <input type="checkbox" name="listedPublicly" value="1" defaultChecked={place.listed_publicly} />
              List publicly
            </label>
            <label className="field">
              <span>Status</span>
              <select className="input" name="relationship" defaultValue={closed ? "closed" : place.relationship || "visited"}>
                <option value="visited">Visited — still checking</option>
                <option value="running_own">Open, running their own thing</option>
                <option value="closed">Closed or moved — do not send people</option>
                <option value="to_meet">Still need to meet them</option>
              </select>
            </label>
          </PostForm>
        </details>
      ) : null}
    </article>
  );
}
