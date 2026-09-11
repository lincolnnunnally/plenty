"use client";

import { useEffect, useState } from "react";
import { GiveCardForm } from "@/components/give-card";
import { PayBoard, type PayRow } from "@/components/pay-board";
import { useLang } from "@/lib/use-lang";
import { passUrl } from "@/lib/pass";

type Found = { id: string; displayName: string; size: number; phone: string; handlingPrepaid?: boolean; passCode?: string; lastVisit?: string };
type WeekItem = { id: string; name: string; quantity: number; unit: string; hint?: string };

export function LineFlow({
  slug,
  pantryName,
  methods,
  cardLive,
  desk,
  initialPass,
  week = []
}: {
  slug: string;
  pantryName: string;
  methods: PayRow[];
  cardLive: boolean;
  desk?: boolean;
  initialPass?: string;
  week?: WeekItem[];
}) {
  const [step, setStep] = useState<"arrive" | "give">("arrive");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState("1");
  const [query, setQuery] = useState(initialPass || "");
  const [pass, setPass] = useState(initialPass || "");
  const [matches, setMatches] = useState<Found[]>([]);
  const [householdId, setHouseholdId] = useState("");
  const [visitId, setVisitId] = useState("");
  const [prepaid, setPrepaid] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deliverAddr, setDeliverAddr] = useState("");
  const [passCode, setPassCode] = useState("");
  const [bag, setBag] = useState<Record<string, number>>({});
  const { t } = useLang();

  useEffect(() => {
    if (!initialPass) return;
    void post({ action: "lookup", pass: initialPass })
      .then((payload) => {
        setMatches(payload.households || []);
        if (payload.households?.[0]) setHouseholdId(payload.households[0].id);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPass]);

  function bagPayload() {
    return JSON.stringify(
      Object.entries(bag)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ id, qty }))
    );
  }

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
      handlingPrepaid?: boolean;
      passCode?: string;
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
      const payload = await post({ action: "lookup", phone, query: desk ? query : "", pass });
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
        householdSize: size,
        pass,
        bag: bagPayload()
      });
      setHouseholdId(payload.householdId || "");
      setVisitId(payload.visitId || "");
      setPrepaid(Boolean(payload.handlingPrepaid));
      setPassCode(payload.passCode || "");
      setMessage(payload.message || "Checked in.");
      setBag({});
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

  async function markSent(channel: string) {
    setError("");
    setBusy(true);
    try {
      const payload = await post({ action: "mark_sent", householdId, visitId, channel });
      setPrepaid(true);
      setMessage(payload.message || "Recorded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that.");
    } finally {
      setBusy(false);
    }
  }

  async function walkthrough(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = await post({
        action: "walkthrough",
        displayName: name || "Walk-in",
        householdSize: size,
        phone,
        bag: bagPayload()
      });
      setHouseholdId(payload.householdId || "");
      setVisitId(payload.visitId || "");
      setPassCode(payload.passCode || "");
      setMessage(payload.message || "Counted.");
      setStep("give");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not count that visit.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "give") {
    return (
      <section className="panel">
        <h2>{prepaid ? t("handlingAlready") : t("handlingTitle")}</h2>
        <p className="lede">{prepaid ? t("handlingPaidLede") : t("handlingLede")}</p>
        {message ? <p className="note">{message}</p> : null}
        {prepaid ? (
          <p className="note">If you want to give more handling, you still can. You do not have to.</p>
        ) : null}
        {cardLive ? (
          <GiveCardForm pantrySlug={slug} householdId={householdId} fromLine />
        ) : (
          <p className="empty">Card is not live yet. Scan Cash App, Venmo, or Zelle if those are posted.</p>
        )}
        {passCode ? (
          <div>
            <h3 style={{ marginTop: 16 }}>{t("yourPass")}</h3>
            <img className="pay-qr" src={`/api/promote/qr?to=${encodeURIComponent(passUrl(passCode))}&size=280`} alt={passCode} width={160} height={160} />
            <p className="note">{passCode}</p>
          </div>
        ) : null}
        <h3 style={{ marginTop: 24 }}>Cash App / Venmo / Zelle</h3>
        <PayBoard methods={methods} empty="No Cash App, Venmo, or Zelle is posted for this pantry yet." />
        {prepaid ? null : (
          <div className="action-row">
            <button className="button" type="button" disabled={busy} onClick={() => void markSent("cashapp")}>{t("sentCashapp")}</button>
            <button className="button" type="button" disabled={busy} onClick={() => void markSent("venmo")}>{t("sentVenmo")}</button>
            <button className="button" type="button" disabled={busy} onClick={() => void markSent("zelle")}>{t("sentZelle")}</button>
            <button className="button" type="button" disabled={busy} onClick={() => void markSent("cash")}>{t("sentCash")}</button>
          </div>
        )}
        <div className="action-row">
          {prepaid ? null : (
            <button className="button leaf" type="button" onClick={waive} disabled={busy}>
              {t("cannotHelp")}
            </button>
          )}
          <a className="button" href="/become">{t("moreHelp")}</a>
          <button className="button" type="button" onClick={() => { setStep("arrive"); setHouseholdId(""); setMessage(""); setPrepaid(false); setPassCode(""); setBag({}); }}>
            {t("nextHousehold")}
          </button>
        </div>
        {desk ? (
          <form
            className="stack"
            style={{ marginTop: 24 }}
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError("");
              try {
                const res = await fetch("/api/pickups", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    kind: "household_delivery",
                    householdId,
                    address: deliverAddr,
                    notes: "Requested at the line"
                  })
                });
                const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
                if (!res.ok || payload.ok === false) throw new Error(payload.message || "Could not request delivery.");
                setMessage(payload.message || "Delivery requested.");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not request delivery.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <h3>Need it brought to them?</h3>
            <label className="field">
              <span>Delivery address</span>
              <input className="input" value={deliverAddr} onChange={(e) => setDeliverAddr(e.target.value)} required placeholder="Street, city" />
            </label>
            <button className="button" type="submit" disabled={busy}>Request delivery</button>
          </form>
        ) : (
          <p className="note"><a href="/need-food">Need food brought to you?</a></p>
        )}
        {error ? <p className="note error" role="alert">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>{desk ? `${t("lineTitle")} — ${pantryName}` : `${t("lineTitle")} — ${pantryName}`}</h2>
      <p className="note">{t("everyone")}</p>
      {desk ? (
        <form className="stack" onSubmit={lookup}>
          <label className="field">
            <span>Name, phone, or HH-…</span>
            <input className="input" value={query} onChange={(e) => { setQuery(e.target.value); setPass(e.target.value); }} placeholder="Jones, 912…, or HH-…" />
          </label>
          <button className="button" type="submit" disabled={busy}>{busy ? t("saving") : t("findHousehold")}</button>
        </form>
      ) : (
        <form className="stack" onSubmit={lookup}>
          <label className="field">
            <span>{t("phoneOptional")}</span>
            <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="912-555-0100" />
          </label>
          <button className="button" type="submit" disabled={busy}>{busy ? t("saving") : t("findMe")}</button>
        </form>
      )}
      {desk && week.length ? (
        <div style={{ marginTop: 16 }}>
          <h3>{t("bagTitle")}</h3>
          <p className="note">{t("bagLede")}</p>
          <div className="grid">
            {week.map((item) => (
              <label className="check" key={item.id}>
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={item.quantity}
                  value={bag[item.id] ?? 0}
                  onChange={(e) => setBag((prev) => ({ ...prev, [item.id]: Number(e.target.value) || 0 }))}
                  style={{ width: 72, display: "inline-block", marginRight: 8 }}
                />
                {item.name} ({item.quantity} {item.unit}){item.hint ? ` · ${item.hint}` : ""}
              </label>
            ))}
          </div>
        </div>
      ) : desk ? (
        <p className="note">{t("noBag")}</p>
      ) : null}
      {matches.length ? (
        <div className="grid" style={{ marginTop: 16 }}>
          {matches.map((h) => (
            <article className="card" key={h.id}>
              <strong>{h.displayName}</strong>
              <p className="note">{h.size} people{h.phone ? ` · ${h.phone}` : ""}{h.handlingPrepaid ? " · handling already given" : ""}{h.lastVisit ? ` · last ${new Date(h.lastVisit).toLocaleDateString()}` : ""}</p>
              <button className="button primary" type="button" onClick={() => checkin(h.id)} disabled={busy}>
                Check in
              </button>
            </article>
          ))}
        </div>
      ) : null}
      <h3 style={{ marginTop: 24 }}>{t("newHousehold")}</h3>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          void checkin();
        }}
      >
        <label className="field">
          <span>{t("name")}</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t("name")} />
        </label>
        <label className="field">
          <span>{t("peopleCount")}</span>
          <input className="input" type="number" min={1} value={size} onChange={(e) => setSize(e.target.value)} />
        </label>
        <label className="field">
          <span>{t("phoneOptional")}</span>
          <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        {error ? <p className="note error" role="alert">{error}</p> : null}
        {message ? <p className="note">{message}</p> : null}
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? t("saving") : t("checkIn")}
        </button>
      </form>
      {desk ? (
        <form className="stack" style={{ marginTop: 18 }} onSubmit={walkthrough}>
          <p className="note">{t("walkthroughHint")}</p>
          <button className="button" type="submit" disabled={busy}>{t("walkthrough")}</button>
        </form>
      ) : null}
    </section>
  );
}
