import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { availableThisWeek, listPromos, weNeedList } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PromotePage() {
  const { pantry } = await requirePantryDesk("/run/promote");
  if (!pantry) redirect("/run");
  const needs = await weNeedList(pantry.id);
  const week = await availableThisWeek(pantry.id);
  const promos = await listPromos(pantry.id);
  const hours = pantry.hours_text.trim() || "hours will be posted on the website";
  const place = pantry.address ? `${pantry.address}, ${pantry.city}` : `${pantry.city || "Vidalia"}, Georgia`;
  const weekLine = week.length ? `This week we have: ${week.map((i) => i.name).join(", ")}.` : "";
  const needLine = needs.length ? `We especially need: ${needs.map((i) => i.name).join(", ")}.` : "";
  const family = `Need groceries in Vidalia? Plenty is a food pantry. Free food for households who are having a hard time feeding their family. ${hours}. ${place}. ${weekLine} https://plenty.unitedundergod.org/need-food`;
  const volunteer = `Volunteer at the Vidalia food pantry. Pick up donated food, pack bags, welcome families, or drive a delivery. No experience needed. ${hours}. Sign up: https://plenty.unitedundergod.org/volunteer`;
  const donor = `Donate to Plenty, a food pantry in Vidalia. Food, money, space, or a vehicle — it goes on a family's table, not in one person's pocket. ${needLine} Give: https://plenty.unitedundergod.org/donate`;

  return (
    <main className="shell">
      <p className="eyebrow">Pantry desk</p>
      <h1>Tell people, in three pastes</h1>
      <p className="lede">Copy one block for families, one for volunteers, one for donors. Paste to Facebook, Nextdoor, a flyer, or a bulletin. Do not add hours that are not posted on the site.</p>
      <RunNav />

      <section className="panel">
        <h2>For families who need food</h2>
        <textarea className="input" readOnly value={family} rows={5} />
        <PostForm action="/api/promos" submitLabel="Save this version">
          <input type="hidden" name="channel" value="families" />
          <input type="hidden" name="title" value="Families — need food" />
          <input type="hidden" name="body" value={family} />
        </PostForm>
      </section>
      <section className="panel">
        <h2>For volunteers</h2>
        <textarea className="input" readOnly value={volunteer} rows={5} />
        <PostForm action="/api/promos" submitLabel="Save this version">
          <input type="hidden" name="channel" value="volunteers" />
          <input type="hidden" name="title" value="Volunteers" />
          <input type="hidden" name="body" value={volunteer} />
        </PostForm>
      </section>
      <section className="panel">
        <h2>For donors</h2>
        <textarea className="input" readOnly value={donor} rows={5} />
        <PostForm action="/api/promos" submitLabel="Save this version">
          <input type="hidden" name="channel" value="donors" />
          <input type="hidden" name="title" value="Donors" />
          <input type="hidden" name="body" value={donor} />
        </PostForm>
      </section>
      <p className="note">This week's food photos live on <a href="/this-week">/this-week</a>. Add pictures under Inventory so that page fills in.</p>

      {promos.length ? (
        <section className="panel">
          <h2>Saved copy</h2>
          {promos.map((promo) => (
            <article className="card" key={promo.id}>
              <span>{promo.channel} · {new Date(promo.created_at).toLocaleDateString()}</span>
              <strong>{promo.title}</strong>
              <p>{promo.body}</p>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
