import { PrintButton } from "@/components/print-button";
import { EIN, LEGAL_NAME } from "@/lib/legal/org";
import { STORE_PITCH } from "@/lib/store-pitch";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-static";
export const metadata = pageMeta(
  "Donating leftover food is better business than throwing it away",
  `Tax deduction, two legal shields, a weekly pickup. Plenty is a program of ${LEGAL_NAME}, EIN ${EIN}.`
);

export default function StoreBriefPage() {
  const signup = "https://plenty.unitedundergod.org/for-stores";
  return (
    <main className="brief-page">
      <div className="print-hide action-row" style={{ marginBottom: 12 }}>
        <PrintButton label="Print this one-pager" />
        <a className="button" href="/for-stores">Set a weekly pickup</a>
      </div>

      <article className="brief-sheet">
        <header className="brief-top">
          <p className="brief-kicker">Plenty food pantry · {LEGAL_NAME} · 501(c)(3)</p>
          <h1 className="store-pop">Throwing food away is the expensive option.</h1>
          <p className="lede">A deduction. Two legal shields. A weekly pickup. We route it to whoever can use it first.</p>
          <p className="brief-ein">EIN {EIN} · A gift to Plenty is a gift to {LEGAL_NAME}</p>
        </header>

        <div className="brief-grid">
          {STORE_PITCH.map((w, i) => (
            <section key={w.kicker}>
              <span>{i + 1}</span>
              <h2>{w.title}</h2>
              <p>{w.line}</p>
            </section>
          ))}
        </div>

        <p className="note" style={{ marginTop: 16 }}>
          You choose: dock pickup, a bag at customer service, or volunteers on the floor if you ask. Extra purchase is never required.
        </p>

        <footer className="brief-foot brief-foot-qr">
          <div>
            <strong>Set a repeating pickup. We come on that day.</strong>
            <p>Pickup volunteers get a text. Produce goes where it will be eaten soonest.</p>
            <p className="brief-fine">Not legal or tax advice. Show this to your accountant.</p>
          </div>
          <div className="brief-qr">
            <img src={`/api/promote/qr?to=${encodeURIComponent(signup)}&format=png&size=480`} alt="Scan to set a weekly pickup" width={140} height={140} />
            <p>Scan to set a pickup</p>
          </div>
        </footer>
      </article>
    </main>
  );
}
