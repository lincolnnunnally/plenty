import { ChannelOpen } from "@/components/channel-open";
import { CopyButton } from "@/components/copy-button";
import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { emailsForAudience, listCampaigns, listPromoSends } from "@/lib/db/queries";
import { facebookShareUrl, mailtoLink, receiveRulesCopy, smsLink, xIntentUrl } from "@/lib/promote/compose";
import { resendConfigured } from "@/lib/promote/email";
import { kitFor } from "@/lib/promote/facts";
import { pantryPublicUrl } from "@/lib/public-url";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PromotePage({ searchParams }: { searchParams: Promise<{ audience?: string; extra?: string }> }) {
  const { pantry } = await requirePantryDesk("/run/promote");
  if (!pantry) redirect("/run");
  const params = await searchParams;
  const audience = params.audience === "volunteers" || params.audience === "donors" ? params.audience : "families";
  const extra = params.extra || "";
  const { facts, kit } = await kitFor(pantry, audience, extra);
  const campaigns = await listCampaigns(pantry.id);
  const sends = await listPromoSends(pantry.id);
  const roster = await emailsForAudience(pantry.id, audience);
  const url = pantryPublicUrl(pantry.slug);
  const canEmail = resendConfigured();
  const igCaptionHint = "Instagram does not let a website post for you. Download the square image, open Instagram, paste the caption.";

  return (
    <main className="shell">
      <p className="eyebrow">Pantry desk · Promote</p>
      <h1>Enter once. Send everywhere.</h1>
      <p className="lede">
        One pantry message becomes Facebook, Instagram, Nextdoor, a flyer, a hand-out card, a QR code,
        and an email with the flyer attached. Live hours, this week's food, distribution days, and
        this pantry's receive rules are pulled in automatically. We do not invent hours or stock.
      </p>
      <RunNav />

      <section className="panel">
        <h2>What this campaign will say (live from the pantry)</h2>
        <div className="grid">
          <article className="card">
            <span>Public page</span>
            <strong><a href={`/p/${pantry.slug}`} target="_blank" rel="noopener noreferrer">{url}</a></strong>
            <p className="note">QR codes land here so people always see this week's food and hours.</p>
          </article>
          <article className="card">
            <span>Hours and place</span>
            <p>{facts.pantry.hours_text.trim() || "Hours not posted yet — posts will say so honestly."}</p>
            <p className="note">{[pantry.address, pantry.city, pantry.state].filter(Boolean).join(", ") || "Address not posted yet."}</p>
          </article>
          <article className="card">
            <span>This week</span>
            {facts.week.length ? <p>{facts.week.map((i) => i.name).join(", ")}</p> : <p className="empty">No items marked available. Add them under Inventory.</p>}
          </article>
          <article className="card">
            <span>To receive food</span>
            <p>{receiveRulesCopy(pantry)}</p>
            <p className="note"><a href="/run">Edit receive rules, donation expectation, and residency on Setup.</a></p>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2>Who is this for?</h2>
        <p className="note">Pick an audience. Add one extra sentence if you want. Everything below rebuilds from that one choice.</p>
        <form className="stack" method="get">
          <label className="check"><input type="radio" name="audience" value="families" defaultChecked={audience === "families"} /> Families who need food</label>
          <label className="check"><input type="radio" name="audience" value="volunteers" defaultChecked={audience === "volunteers"} /> Volunteers</label>
          <label className="check"><input type="radio" name="audience" value="donors" defaultChecked={audience === "donors"} /> Donors</label>
          <label className="field">
            <span>Extra sentence (optional)</span>
            <input className="input" name="extra" defaultValue={extra} placeholder="Saturday line starts at 9. Bring a bag if you have one." />
          </label>
          <button className="button primary" type="submit">Build this campaign</button>
        </form>
        <div style={{ marginTop: 16 }}>
          <PostForm action="/api/promote/campaign" submitLabel="Save this campaign">
            <input type="hidden" name="audience" value={audience} />
            <input type="hidden" name="extra" value={extra} />
          </PostForm>
        </div>
      </section>

      <section className="panel">
        <h2>QR codes — scan to live information</h2>
        <p className="lede" style={{ fontSize: "1.05rem" }}>Print these on flyers, bags, church bulletins, and the pantry door. The code never goes stale: it opens the pantry page.</p>
        <div className="grid">
          <article className="card">
            <span>Pantry page</span>
            <img src={`/api/promote/qr?to=${encodeURIComponent(url)}&format=png&size=360`} alt="QR code to the pantry page" width={180} height={180} />
            <div className="action-row">
              <a className="button primary" href={`/api/promote/qr?to=${encodeURIComponent(url)}&format=png&size=1024`}>Download QR PNG</a>
              <a className="button" href={`/api/promote/qr?to=${encodeURIComponent(url)}&format=svg`}>Download SVG</a>
            </div>
          </article>
          <article className="card">
            <span>Get food</span>
            <img src={`/api/promote/qr?to=${encodeURIComponent("https://plenty.unitedundergod.org/need-food")}&format=png&size=360`} alt="QR code to get food" width={180} height={180} />
            <a className="button" href={`/api/promote/qr?to=${encodeURIComponent("https://plenty.unitedundergod.org/need-food")}&format=png&size=1024`}>Download</a>
          </article>
          <article className="card">
            <span>Volunteer</span>
            <img src={`/api/promote/qr?to=${encodeURIComponent("https://plenty.unitedundergod.org/volunteer")}&format=png&size=360`} alt="QR code to volunteer" width={180} height={180} />
            <a className="button" href={`/api/promote/qr?to=${encodeURIComponent("https://plenty.unitedundergod.org/volunteer")}&format=png&size=1024`}>Download</a>
          </article>
          <article className="card">
            <span>Give</span>
            <img src={`/api/promote/qr?to=${encodeURIComponent("https://plenty.unitedundergod.org/donate")}&format=png&size=360`} alt="QR code to give" width={180} height={180} />
            <a className="button" href={`/api/promote/qr?to=${encodeURIComponent("https://plenty.unitedundergod.org/donate")}&format=png&size=1024`}>Download</a>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2>Flyers and cards you can put in a hand</h2>
        <p>Letter flyer for bulletin boards. Small card for pockets, bags, and windshields. Both carry a QR to live information.</p>
        <div className="grid">
          <article className="card">
            <span>Letter flyer</span>
            <img src={`/api/promote/image?kind=square&audience=${audience}&extra=${encodeURIComponent(extra)}`} alt="Flyer preview" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
            <div className="action-row">
              <a className="button primary" href={`/api/promote/flyer?audience=${audience}&kind=flyer&extra=${encodeURIComponent(extra)}`}>Download PDF flyer</a>
              <a className="button" href={`/run/promote/print?audience=${audience}&kind=flyer&extra=${encodeURIComponent(extra)}`} target="_blank" rel="noopener noreferrer">Print</a>
            </div>
          </article>
          <article className="card">
            <span>Hand-out card</span>
            <p className="note">{kit.flyerHeadline}</p>
            <div className="action-row">
              <a className="button primary" href={`/api/promote/flyer?audience=${audience}&kind=card&extra=${encodeURIComponent(extra)}`}>Download PDF card</a>
              <a className="button" href={`/run/promote/print?audience=${audience}&kind=card&extra=${encodeURIComponent(extra)}`} target="_blank" rel="noopener noreferrer">Print cards</a>
            </div>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2>Post in many places</h2>
        <p className="note">
          Facebook and Instagram login for auto-posting is not connected on this pantry yet — that needs a Meta page login Lincoln issues once. Until then, every post is written in full, copied in one tap, and opened in the right app. That is complete, not a placeholder.
        </p>
        <div className="grid">
          <article className="card">
            <span>Facebook</span>
            <textarea className="input" readOnly rows={8} value={kit.facebook} />
            <div className="action-row">
              <CopyButton text={kit.facebook} label="Copy Facebook post" />
              <ChannelOpen href={facebookShareUrl(url)} label="Open Facebook share" copyFirst={kit.facebook} />
            </div>
          </article>
          <article className="card">
            <span>Instagram</span>
            <textarea className="input" readOnly rows={8} value={kit.instagram} />
            <p className="note">{igCaptionHint}</p>
            <div className="action-row">
              <CopyButton text={kit.instagram} label="Copy caption" />
              <a className="button leaf" href={`/api/promote/image?kind=square&audience=${audience}&extra=${encodeURIComponent(extra)}`} download>Download square image</a>
              <a className="button" href={`/api/promote/image?kind=story&audience=${audience}&extra=${encodeURIComponent(extra)}`} download>Download story image</a>
            </div>
          </article>
          <article className="card">
            <span>Nextdoor / neighborhood</span>
            <textarea className="input" readOnly rows={7} value={kit.nextdoor} />
            <CopyButton text={kit.nextdoor} label="Copy Nextdoor post" />
          </article>
          <article className="card">
            <span>X / Twitter</span>
            <textarea className="input" readOnly rows={4} value={kit.xPost} />
            <div className="action-row">
              <CopyButton text={kit.xPost} />
              <ChannelOpen href={xIntentUrl(kit.xPost)} label="Open X" />
            </div>
          </article>
          <article className="card">
            <span>Text message</span>
            <textarea className="input" readOnly rows={3} value={kit.sms} />
            <div className="action-row">
              <CopyButton text={kit.sms} />
              <a className="button leaf" href={smsLink(kit.sms)}>Open messages</a>
            </div>
          </article>
          <article className="card">
            <span>Church bulletin / newsletter</span>
            <textarea className="input" readOnly rows={4} value={kit.bulletin} />
            <CopyButton text={kit.bulletin} label="Copy bulletin blurb" />
          </article>
        </div>
      </section>

      <section className="panel">
        <h2>Email with the flyer attached</h2>
        <p>
          Send this campaign to the {audience} roster ({roster.length} {roster.length === 1 ? "address" : "addresses"} on file)
          and/or paste more emails. Each message includes the flyer PDF.
        </p>
        {!canEmail ? (
          <p className="note">Direct send is not configured on this host yet. Use “Open a draft email” below — that still attaches the words. We will not pretend a send succeeded.</p>
        ) : null}
        <PostForm action="/api/promote/email" submitLabel={canEmail ? "Send email with flyer" : "Try send (will say if it is not configured)"}>
          <input type="hidden" name="audience" value={audience} />
          <input type="hidden" name="extra" value={extra} />
          <label className="check"><input type="checkbox" name="useRoster" defaultChecked={roster.length > 0} /> Send to the {audience} roster ({roster.length})</label>
          <label className="field">
            <span>More emails (comma or line separated)</span>
            <textarea className="input" name="to" placeholder="pastor@church.org, neighbor@…" />
          </label>
          <label className="field">
            <span>Subject</span>
            <input className="input" name="subject" defaultValue={kit.emailSubject} />
          </label>
        </PostForm>
        <div className="action-row">
          <a className="button" href={mailtoLink(kit.emailSubject, kit.facebook)}>Open a draft email</a>
        </div>
        {sends.length ? (
          <div className="table-scroll" style={{ marginTop: 18 }}>
            <table className="table">
              <thead><tr><th>When</th><th>Channel</th><th>To</th><th>Status</th></tr></thead>
              <tbody>
                {sends.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.created_at).toLocaleString()}</td>
                    <td>{s.channel} · {s.audience}</td>
                    <td>{s.to_count}</td>
                    <td>{s.status}{s.error ? ` · ${s.error}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {campaigns.length ? (
        <section className="panel">
          <h2>Saved campaigns</h2>
          {campaigns.map((c) => (
            <article className="card" key={c.id}>
              <span>{c.audience} · {new Date(c.created_at).toLocaleString()}</span>
              <p>{c.extra || "Built from live pantry facts."}</p>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
