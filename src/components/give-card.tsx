"use client";

import { useState } from "react";

const PRESETS = [10, 25, 50, 100];

export function GiveCardForm({
  signedInEmail,
  pantrySlug,
  householdId,
  fromLine
}: {
  signedInEmail?: string;
  pantrySlug?: string;
  householdId?: string;
  fromLine?: boolean;
}) {
  const [preset, setPreset] = useState<number | "custom">(25);
  const [custom, setCustom] = useState("");
  const [email, setEmail] = useState(signedInEmail || "");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const dollars = preset === "custom" ? Number(custom.replace(/[^0-9.]/g, "")) : preset;
  const valid = Number.isFinite(dollars) && dollars >= 1 && dollars <= 50000;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!valid) {
      setError("Enter an amount between $1 and $50,000.");
      return;
    }
    setWorking(true);
    try {
      const res = await fetch("/api/give/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountDollars: dollars, email, pantrySlug, householdId, fromLine: fromLine ? "1" : "" })
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; message?: string };
      if (!res.ok || !payload.url) {
        setError(payload.message || "Card checkout is not live yet. Use Cash App, Venmo, or Zelle if those are posted.");
        setWorking(false);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("Could not reach card checkout. Check your connection and try again.");
      setWorking(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <p className="note">Card, Apple Pay, or Google Pay. Food is never held back because someone cannot give.</p>
      <div className="chip-row" role="group" aria-label="Amount">
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            className={preset === n ? "chip active" : "chip"}
            onClick={() => setPreset(n)}
          >
            ${n}
          </button>
        ))}
        <button type="button" className={preset === "custom" ? "chip active" : "chip"} onClick={() => setPreset("custom")}>
          Other
        </button>
      </div>
      {preset === "custom" ? (
        <label className="field">
          <span>Amount in dollars</span>
          <input className="input" inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} />
        </label>
      ) : null}
      <label className="field">
        <span>Email for a receipt (optional if you already have an account)</span>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
      </label>
      {error ? <p className="note error" role="alert">{error}</p> : null}
      <button className="button primary" type="submit" disabled={working}>
        {working ? "Opening card checkout…" : `Give $${Number.isFinite(dollars) && dollars >= 1 ? dollars : "—"} by card`}
      </button>
    </form>
  );
}
