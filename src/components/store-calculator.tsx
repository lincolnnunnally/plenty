"use client";

import { useMemo, useState } from "react";
import { money, storeBenefit } from "@/lib/store-math";

export function StoreCalculator() {
  const [cost, setCost] = useState("200");
  const [wouldSell, setWouldSell] = useState("600");
  const [haul, setHaul] = useState("25");
  const [weeks, setWeeks] = useState("52");

  const result = useMemo(
    () =>
      storeBenefit({
        cost: Number(cost) || 0,
        wouldSell: Number(wouldSell) || 0,
        haulFee: Number(haul) || 0,
        weeks: Number(weeks) || 52
      }),
    [cost, wouldSell, haul, weeks]
  );

  return (
    <section className="panel" id="calculator">
      <p className="eyebrow">Your numbers</p>
      <h2>See what throwing it away actually costs you</h2>
      <p className="lede" style={{ fontSize: "1.05rem" }}>
        A meat or dairy manager can punch in one week of what goes in the dumpster.
        The tax line is cost plus half the profit you would have made, up to twice
        the cost. Then add what you pay the hauler.
      </p>
      <div className="store-calc">
        <div className="store-calc-fields">
          <label className="field">
            <span>What you paid for that food this week</span>
            <input className="input" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
          </label>
          <label className="field">
            <span>What it would have sold for</span>
            <input className="input" inputMode="decimal" value={wouldSell} onChange={(e) => setWouldSell(e.target.value)} />
          </label>
          <label className="field">
            <span>Dumpster / hauling fee this week</span>
            <input className="input" inputMode="decimal" value={haul} onChange={(e) => setHaul(e.target.value)} />
          </label>
          <label className="field">
            <span>Weeks like this in a year</span>
            <input className="input" inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value)} />
          </label>
        </div>
        <div className="store-calc-out">
          <p>
            <strong>Throw it away</strong>
            <span>Write-off {money(result.dumpster)} · still pay {money(result.haul)} to haul it</span>
          </p>
          <p>
            <strong>Donate it to Plenty</strong>
            <span>Write-off {money(result.donate)}{result.capped ? " (at the twice-cost cap)" : ""} · we pick it up</span>
          </p>
          <p className="store-calc-punch">
            This week, donating may be worth {money(result.weekly)} more than the dumpster.
            Over a year: {money(result.yearly)}.
          </p>
          <p className="note">
            People who felt that kindness still spend leftover money in your store.
            Not legal or tax advice. Show these numbers to your accountant (IRC § 170(e)(3)).
          </p>
        </div>
      </div>
    </section>
  );
}
