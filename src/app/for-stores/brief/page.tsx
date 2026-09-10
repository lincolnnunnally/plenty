import { PrintButton } from "@/components/print-button";
import { EIN, LEGAL_NAME } from "@/lib/legal/org";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-static";
export const metadata = pageMeta(
  "Donating unsold food is better business than throwing it away",
  `You benefit and you are protected. That’s why Publix, Kroger, Walmart, and Costco donate. Plenty is a program of ${LEGAL_NAME}, EIN ${EIN}.`
);

const WINS = [
  { n: "1", title: "Your sales stay", line: "Pantry families were not filling a cart at full price. Money they do have still gets spent in your store — milk, meat, soap, a birthday cake." },
  { n: "2", title: "A better write-off than the dumpster", line: "Donate wholesome food to our 501(c)(3): cost plus half the unsold profit. Example: paid $200, would sell $300. Trash ≈ $200. Donate ≈ $250." },
  { n: "3", title: "Trash costs you money", line: "Disposal has a fee. Donation is often cheaper per pound — and it clears the shelf for food people will pay full price for." },
  { n: "4", title: "The lawsuit fear is covered", line: "Federal Emerson Act + Georgia law protect a good-faith gift. Recipients sign a digital waiver at our line." }
] as const;

export default function StoreBriefPage() {
  const pickup = "https://plenty.unitedundergod.org/donate";
  return (
    <main className="brief-page">
      <div className="print-hide action-row" style={{ marginBottom: 12 }}>
        <PrintButton label="Print this one-pager" />
        <a className="button" href="/donate">Offer a pickup</a>
      </div>

      <article className="brief-sheet">
        <header className="brief-top">
          <p className="brief-kicker">Plenty food pantry · {LEGAL_NAME} · 501(c)(3)</p>
          <h1 className="store-pop">Donating unsold food is better business than throwing it away</h1>
          <p className="lede">You benefit. You are protected. That’s why Publix, Kroger, Walmart, and Costco already do it.</p>
          <p className="brief-ein">EIN {EIN} · A gift to Plenty is a gift to {LEGAL_NAME}</p>
        </header>

        <div className="brief-grid">
          {WINS.map((w) => (
            <section key={w.n}>
              <span>{w.n}</span>
              <h2>{w.title}</h2>
              <p>{w.line}</p>
            </section>
          ))}
        </div>

        <p className="note" style={{ marginTop: 16 }}>
          You choose: we pick up at the dock, you hold a bag at customer service, or — only if you ask — a volunteer meets them with the bag. Extra purchase is not required.
        </p>

        <footer className="brief-foot brief-foot-qr">
          <div>
            <strong>You choose. We meet people where the opportunity is.</strong>
            <p>Dock, desk hold, or volunteers on your floor if you ask. Receipt either way.</p>
            <p className="brief-fine">Not legal or tax advice. Show this to your accountant.</p>
          </div>
          <div className="brief-qr">
            <img src={`/api/promote/qr?to=${encodeURIComponent(pickup)}&format=png&size=480`} alt="Scan to schedule a food pickup" width={140} height={140} />
            <p>Scan to schedule a pickup</p>
          </div>
        </footer>
      </article>
    </main>
  );
}
