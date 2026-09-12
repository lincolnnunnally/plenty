import { PrintButton } from "@/components/print-button";
import { StorePitchCase, StorePitchIntro } from "@/components/store-pitch";
import { EIN, LEGAL_NAME } from "@/lib/legal/org";
import { STORE_DESCRIPTION, STORE_FINE, STORE_TITLE } from "@/lib/store-pitch";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-static";
export const metadata = pageMeta(STORE_TITLE, STORE_DESCRIPTION);

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
          <StorePitchIntro compact einLine={`EIN ${EIN} · A gift to Plenty is a gift to ${LEGAL_NAME}`} />
        </header>
        <StorePitchCase />

        <p className="note" style={{ marginTop: 16 }}>
          You choose: dock pickup, a bag at customer service, or volunteers on the floor if you ask. Extra purchase is never required. People who felt the kindness often spend leftover money in your store anyway. Corporate has to say yes? Leave this page. We wait.
        </p>

        <footer className="brief-foot brief-foot-qr">
          <div>
            <strong>Set a repeating pickup. We come on that day.</strong>
            <p>Pickup volunteers get a text. Produce goes where it will be eaten soonest.</p>
            <p className="brief-fine">{STORE_FINE}</p>
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
