"use client";

import { useState } from "react";
import { GiveCardForm } from "@/components/give-card";
import { PayBoard, type PayRow } from "@/components/pay-board";

type Found = { id: string; displayName: string; size: number; phone: string };

export function LineFlow({
  slug,
  pantryName,
  methods,
  cardLive,
  desk
}: {
  slug: string;
  pantryName: string;
  methods: PayRow[];
  cardLive: boolean;
  desk?: boolean;
}) {
  const [step, setStep] = useState<"arrive" | "give">("arrive");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState("1");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Found[]>([]);
  const [householdId, setHouseholdId] = useState("");
  const [visitId, setVisitId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(body: Record<string, string>) {
    const res = await fetch("/api/line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pantrySlug: slug, ...body })
    });
    const payload = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      householdId?: string;
      visitId?: string;
      displayName?: string;
      households?: Found[];
    };
    if (!res.ok || payload.ok === false) throw new Error(payload.message || "That did not save.");
    return payload;
  }

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = await post({ action: "lookup", phone, query: desk ? query : "" });
      setMatches(payload.households || []);
      setMessage(payload.message || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not search.");
    } finally {
      setBusy(false);
    }
  }

  async function checkin(id?: string) {
    setError("");
    setBusy(true);
    try {
      const payload = await post({
        action: "checkin",
        householdId: id || householdId,
        displayName: name,
        phone,
        householdSize: size
      });
      setHouseholdId(payload.householdId || "");
      setVisitId(payload.visitId || "");
      setMessage(payload.message || "Checked in.");
      setStep("give");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check in.");
    } finally {
      setBusy(false);
    }
  }

  async function waive() {
    setError("");
    setBusy(true);
    try {
      const payload = await post({ action: "waive", householdId, visitId });
      setMessage(payload.message || "They still get food.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "give") {
    return (
      <section className="panel">
        <h2>If you can give a little</h2>
        <p className="lede">
          You are already checked in. Food is yours either way. If you can send a gift on Cash App, Venmo, Zelle,
          or a card, it helps the next family. If you cannot, say so.
        </p>
        {message ? <p className="note">{message}</p> : null}
        {cardLive ? (
          <GiveCardForm pantrySlug={slug} householdId={householdId} fromLine />
        ) : (
          <p className="empty">Card is not live yet. Scan Cash App, Venmo, or Zelle if those are posted.</p>
        )}
        <h3 style={{ marginTop: 24 }}>Scan</h3>
        <PayBoard methods={methods} empty="No Cash App, Venmo, or Zelle is posted for this pantry yet." />
        <div className="action-row">
          <button className="button leaf" type="button" onClick={waive} disabled={busy}>
            I cannot give this time — still give me food
          </button>
          <button className="button" type="button" onClick={() => { setStep("arrive"); setHouseholdId(""); setMessage(""); }}>
            Next household
          </button>
        </div>
        {error ? <p className="note error" role="alert">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>{desk ? `Check people in at ${pantryName}` : `Check in at ${pantryName}`}</h2>
      <p className="note">A phone helps us find you next time. If you do not have one with you, we will write your name.</p>
      {desk ? (
        <form className="stack" onSubmit={lookup}>
          <label className="field">
            <span>Search name or phone</span>
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Jones or 912…" />
          </label>
          <button className="button" type="submit" disabled={busy}>{busy ? "Searching…" : "Find household"}</button>
        </form>
      ) : (
        <form className="stack" onSubmit={lookup}>
          <label className="field">
            <span>Phone if you have one</span>
            <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="912-555-0100" />
          </label>
          <button className="button" type="submit" disabled={busy}>{busy ? "Searching…" : "Find me"}</button>
        </form>
      )}
      {matches.length ? (
        <div className="grid" style={{ marginTop: 16 }}>
          {matches.map((h) => (
            <article className="card" key={h.id}>
              <strong>{h.displayName}</strong>
              <p className="note">{h.size} people{h.phone ? ` · ${h.phone}` : ""}</p>
              <button className="button primary" type="button" onClick={() => checkin(h.id)} disabled={busy}>
                Check in
              </button>
            </article>
          ))}
        </div>
      ) : null}
      <h3 style={{ marginTop: 24 }}>New household</h3>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          void checkin();
        }}
      >
        <label className="field">
          <span>Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Who we should welcome" />
        </label>
        <label className="field">
          <span>How many people you are feeding</span>
          <input className="input" type="number" min={1} value={size} onChange={(e) => setSize(e.target.value)} />
        </label>
        <label className="field">
          <span>Phone (optional)</span>
          <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        {error ? <p className="note error" role="alert">{error}</p> : null}
        {message ? <p className="note">{message}</p> : null}
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Check in — then optional gift"}
        </button>
      </form>
    </section>
  );
}
