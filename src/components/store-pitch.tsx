import {
  STORE_DONATE,
  STORE_FINE,
  STORE_HEADLINE,
  STORE_LEDE,
  STORE_LEDE_SHORT,
  STORE_MATH,
  STORE_PITCH,
  STORE_PROOF,
  STORE_TOSS
} from "@/lib/store-pitch";

export function StorePitchIntro({
  einLine,
  compact = false
}: {
  einLine?: string;
  compact?: boolean;
}) {
  return (
    <>
      <h1 className="store-pop">{STORE_HEADLINE}</h1>
      <p className="lede">{compact ? STORE_LEDE_SHORT : STORE_LEDE}</p>
      <p className="lede store-proof">{STORE_PROOF}</p>
      {einLine ? <p className="brief-ein">{einLine}</p> : null}
    </>
  );
}

export function StorePitchCase() {
  return (
    <>
      <div className="store-versus">
        <article className="toss">
          <h2>{STORE_TOSS.title}</h2>
          <ul>
            {STORE_TOSS.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="give">
          <h2>{STORE_DONATE.title}</h2>
          <ul>
            {STORE_DONATE.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <p className="store-math">
        <strong>{STORE_MATH.setup}</strong>
        <span>
          {STORE_MATH.toss}
          {" → "}
          {STORE_MATH.donate}
        </span>
        <em>{STORE_MATH.note}</em>
      </p>

      <div className="brief-grid" style={{ marginTop: 16 }}>
        {STORE_PITCH.map((w, i) => (
          <section key={w.kicker}>
            <span>{i + 1}</span>
            <h2>{w.title}</h2>
            <p>{w.line}</p>
          </section>
        ))}
      </div>
      <p className="note" style={{ marginTop: 12 }}>{STORE_FINE}</p>
    </>
  );
}
