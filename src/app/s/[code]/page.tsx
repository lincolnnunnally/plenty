import { PostForm } from "@/components/post-form";
import { publicStoreCardByCode } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return pageMeta(`Plenty store card ${code.toUpperCase()}`, "Confirm a Plenty in-store food hold. Extra purchase is not required.");
}

export default async function StoreCardLookupPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const card = await publicStoreCardByCode(code).catch(() => null);

  if (!card) {
    return (
      <main className="shell">
        <p className="eyebrow">Store card</p>
        <h1>This is not a Plenty card</h1>
        <p className="lede">The code did not match a card we issued. Do not give food on this code.</p>
      </main>
    );
  }

  const issued = card.status === "issued";
  const statusLine =
    card.status === "issued"
      ? "This card is good. Hand them the hold."
      : card.status === "redeemed"
        ? `Already collected${card.redeemed_at ? ` on ${new Date(card.redeemed_at).toLocaleDateString()}` : ""}.`
        : card.status === "expired"
          ? "This card has expired. Call the pantry for a new one."
          : "This card is not valid.";

  return (
    <main className="shell">
      <p className="eyebrow">{card.partner_name}</p>
      <h1>{issued ? "Good card" : "Not collectable"}</h1>
      <p className="lede">{statusLine}</p>

      <section className="panel store-card-sheet">
        <p className="eyebrow">{card.code}</p>
        <h2>{card.household_name}</h2>
        {card.volunteers_on_site ? (
          <p>
            A Plenty volunteer will carry your bag to you{card.meet_note ? ` (${card.meet_note})` : ` at ${card.hold_desk}`}.
            They can pray with you if you want. You do not have to. Then you may shop for what is not in the bag.
          </p>
        ) : (
          <p>Get the bag first at <strong>{card.hold_desk}</strong>. Open it. Then shop only if you want what is not already in the bag.</p>
        )}
        {card.partner_address ? <p className="note">{card.partner_address}</p> : null}
        {card.hours_text ? <p className="note">{card.hours_text}</p> : null}
        <p><strong>In this bag (free):</strong> {card.items_text || "A surprise hold. Open it before you shop."}</p>
        <p><strong>You may still want:</strong> {card.still_need_text || "Whatever is not in the bag — only if you choose to buy it."}</p>
        {card.expires_at && issued ? <p className="note">Use by {new Date(card.expires_at).toLocaleDateString()}.</p> : null}
        <p className="store-card-rule">This food is a gift. Do not mix it with a paid cart at checkout. Extra purchase is not required. A handling donation, if you can, happens with Plenty — not here.</p>
        <p className="note">Want a person with this food — a prayer if you want one, a next step? Food does not depend on it. {card.volunteers_on_site ? "The volunteer at the store is that person today." : null} <a href="/become">After groceries</a>.</p>
      </section>

      {issued ? (
        <section className="panel">
          <h2>Store staff — mark collected</h2>
          <p className="note">
            {card.volunteers_on_site
              ? "Let the Plenty volunteer carry the bag to the family. Offer to pray. Do not require it. Do not ring the gift. Do not ask them to buy anything else."
              : "Hand the bag. Put the slip in it. Do not ring the gift. Do not ask them to buy anything else."}
            {" "}Use the PIN Plenty gave this store.
          </p>
          <PostForm action="/api/store-pickup" submitLabel="Mark collected">
            <input type="hidden" name="code" value={card.code} />
            <label className="field"><span>Store PIN</span><input className="input" name="pin" inputMode="numeric" required autoComplete="off" /></label>
            <label className="field"><span>What they collected (optional)</span><input className="input" name="note" defaultValue={card.items_text} /></label>
          </PostForm>
        </section>
      ) : null}

      <p className="note">Pantry desk: <a href="/run/stores">store partners</a>. Families: <a href="/need-food">get food</a>.</p>
    </main>
  );
}
