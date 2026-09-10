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
        <p>Show this at <strong>{card.hold_desk}</strong>.</p>
        {card.partner_address ? <p className="note">{card.partner_address}</p> : null}
        {card.hours_text ? <p className="note">{card.hours_text}</p> : null}
        <p><strong>{card.items_text || "This week's Plenty hold"}</strong></p>
        {card.expires_at && issued ? <p className="note">Use by {new Date(card.expires_at).toLocaleDateString()}.</p> : null}
        <p className="store-card-rule">This food is a gift. Extra purchase is not required.</p>
      </section>

      {issued ? (
        <section className="panel">
          <h2>Store staff — mark collected</h2>
          <p className="note">Use the PIN Plenty gave this store. Do not ask the family to buy anything else.</p>
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
