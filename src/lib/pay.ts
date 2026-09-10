export type PayKind = "venmo" | "cashapp" | "zelle" | "cash";

export type PayMethod = {
  pantry_id: string;
  kind: PayKind;
  handle: string;
  posted: boolean;
};

export function isPayKind(value: string): value is PayKind {
  return value === "venmo" || value === "cashapp" || value === "zelle" || value === "cash";
}

export function payUrl(kind: PayKind, handle: string): string | null {
  const h = handle.trim();
  if (!h) return null;
  if (kind === "venmo") return `https://venmo.com/u/${h.replace(/^@/, "")}`;
  if (kind === "cashapp") {
    const tag = h.startsWith("$") ? h : `$${h.replace(/^\$/, "")}`;
    return `https://cash.app/${tag}`;
  }
  if (kind === "zelle") return null;
  return null;
}

export function payQrTarget(kind: PayKind, handle: string): string | null {
  const url = payUrl(kind, handle);
  if (url) return url;
  const h = handle.trim();
  if (kind === "zelle" && h) return h;
  return null;
}

export function payLabel(kind: PayKind) {
  if (kind === "venmo") return "Venmo";
  if (kind === "cashapp") return "Cash App";
  if (kind === "zelle") return "Zelle";
  return "Cash in person";
}

export function payHint(kind: PayKind) {
  if (kind === "venmo") return "Venmo username, with or without @";
  if (kind === "cashapp") return "Cash App $Cashtag";
  if (kind === "zelle") return "Zelle email or phone — the real one";
  return "Where to hand cash, if you want that posted";
}
