"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="shell">
      <p className="eyebrow">Plenty</p>
      <h1>This page hit a snag</h1>
      <p className="lede">Try again. Your food, shift, or gift is still here.</p>
      <div className="action-row">
        <button type="button" className="button primary" onClick={reset}>Try again</button>
        <a className="button" href="/account">Account</a>
        <a className="button" href="/">Home</a>
      </div>
      {error.digest ? <p className="note">Reference {error.digest}</p> : null}
    </main>
  );
}
