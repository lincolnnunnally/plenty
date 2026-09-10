import { PayBoard } from "@/components/pay-board";
import { availableThisWeek, getPantryBySlug, listDistributions, listShifts, postedPayMethods, weNeedList } from "@/lib/db/queries";
import { donationPolicyCopy, receiveRulesCopy } from "@/lib/promote/compose";
import { pantryPublicUrl } from "@/lib/public-url";
import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const pantry = await getPantryBySlug(slug);
    if (pantry) {
      const place = [pantry.city, pantry.state].filter(Boolean).join(", ") || "Vidalia, Georgia";
      return pageMeta(
        `${pantry.name} food pantry`,
        pantry.about || `${pantry.name} is a food pantry in ${place}. Get groceries, volunteer, or give. Scan the page QR for this week's food.`
      );
    }
  } catch {
    // fall through
  }
  return pageMeta("Food pantry", "Plenty food pantry. Hours and address are posted when they are real.");
}

export default async function PantryPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let pantry = null;
  try {
    pantry = await getPantryBySlug(slug);
  } catch {
    pantry = null;
  }
  if (!pantry) {
    return (
      <main className="shell">
        <p className="eyebrow">Vidalia</p>
        <h1>This pantry page is getting established</h1>
        <p className="empty">Hours, address, and shelves will show here once the pantry database is connected and a steward types what is real. We will not invent them.</p>
        <a className="button primary" href="/">Back to Plenty</a>
      </main>
    );
  }
  const available = await availableThisWeek(pantry.id);
  const needs = await weNeedList(pantry.id);
  const shifts = await listShifts(pantry.id);
  const days = await listDistributions(pantry.id);
  const upcoming = days.filter((d) => d.status !== "cancelled" && d.status !== "done");
  const pay = await postedPayMethods(pantry.id).catch(() => []);

  return (
    <main className="shell">
      <p className="eyebrow">Food pantry · {pantry.city}{pantry.state ? `, ${pantry.state}` : ""} · {pantry.status === "open" ? "Open" : "Getting established"}</p>
      <h1>{pantry.name} — free groceries in {pantry.city || "Vidalia"}</h1>
      <p className="lede">{pantry.about || "This is a food pantry. If you are having a hard time feeding your family, you can get groceries here. You can also volunteer or donate food, money, space, or a vehicle."}</p>
      <p className="note">Share this pantry: <a href={`/p/${pantry.slug}`}>{pantryPublicUrl(pantry.slug)}</a></p>
      <div className="action-row">
        <a className="button primary" href="/need-food">I need food</a>
        <a className="button leaf" href="/volunteer">Volunteer</a>
        <a className="button" href="/donate">Give</a>
        <a className="button" href="/for-stores">Stores: donate food</a>
      </div>

      <div className="grid">
        <article className="card">
          <span>When and where</span>
          {pantry.hours_text ? <p>{pantry.hours_text}</p> : <p className="empty">Hours not posted yet — we will not invent them.</p>}
          {pantry.address ? <p>{pantry.address}<br />{pantry.city}, {pantry.state} {pantry.zip}</p> : <p className="note">Address not posted yet.</p>}
          {pantry.phone ? <p>{pantry.phone}</p> : null}
          <p className="note">Visit style: {pantry.visit_style.replace("_", " ")}</p>
        </article>
        <article className="card">
          <span>This week on the shelves</span>
          {available.length ? (
            <ul>{available.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
          ) : (
            <p className="empty">No items marked available this week.</p>
          )}
        </article>
      </div>

      <section className="panel">
        <h2>To receive food at this pantry</h2>
        <p>{receiveRulesCopy(pantry)}</p>
        <p className="note">{donationPolicyCopy(pantry)}</p>
        <div className="grid">
          <article className="card">
            <span>Scan for this page anytime</span>
            <img src={`/api/promote/qr?to=${encodeURIComponent(pantryPublicUrl(pantry.slug))}&format=png&size=360`} alt="QR code for this pantry" width={160} height={160} />
            <p className="note">Hours, this week's food, and these rules stay current when you scan.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Distribution days</p>
        {upcoming.length ? (
          <div className="grid">
            {upcoming.map((day) => (
              <article className="card" key={day.id}>
                <span>{day.status}</span>
                <strong>{day.title}</strong>
                <p>{new Date(day.starts_at).toLocaleString()}</p>
                {day.notes ? <p className="note">{day.notes}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No distribution days posted yet.</p>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Volunteer shifts</p>
        {shifts.length ? (
          <div className="grid">
            {shifts.map((shift) => (
              <article className="card" key={shift.id}>
                <span>{shift.role}</span>
                <strong>{shift.title}</strong>
                <p>{new Date(shift.starts_at).toLocaleString()}</p>
                <p className="note">{shift.signup_count}{shift.capacity ? ` / ${shift.capacity}` : ""} signed up</p>
                <a className="button" href="/volunteer">Take a shift</a>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No shifts on the board yet.</p>
        )}
      </section>

      {needs.length ? (
        <section className="panel">
          <p className="eyebrow">We need</p>
          <div className="chip-row">{needs.map((item) => <span className="chip" key={item.id}>{item.name}</span>)}</div>
          <a className="button primary" href="/donate">Bring something</a>
        </section>
      ) : null}

      <section className="panel">
        <h2>Give if you can</h2>
        <p className="note">Food is never held back because someone cannot give. Scan Cash App, Venmo, or Zelle if they are posted.</p>
        <PayBoard methods={pay} />
        <a className="button" href="/donate">Give by card</a>
      </section>
    </main>
  );
}
