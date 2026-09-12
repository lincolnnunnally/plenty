/** Enhanced food-inventory deduction (IRC § 170(e)(3)). Not tax advice. */

export function foodInventoryDeduction(cost: number, wouldSell: number) {
  const basis = Math.max(0, Number(cost) || 0);
  const fmv = Math.max(0, Number(wouldSell) || 0);
  const profit = Math.max(0, fmv - basis);
  const uncapped = basis + profit * 0.5;
  const cap = basis * 2;
  const donate = Math.min(uncapped, cap);
  return {
    dumpster: basis,
    donate,
    extra: Math.max(0, donate - basis),
    capped: uncapped >= cap - 0.005
  };
}

export function storeBenefit(input: {
  cost: number;
  wouldSell: number;
  haulFee?: number;
  weeks?: number;
}) {
  const tax = foodInventoryDeduction(input.cost, input.wouldSell);
  const haul = Math.max(0, Number(input.haulFee) || 0);
  const weeks = Math.max(1, Math.min(52, Math.round(Number(input.weeks) || 52)));
  const weekly = tax.extra + haul;
  return {
    ...tax,
    haul,
    weeks,
    weekly,
    yearly: weekly * weeks
  };
}

export function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
