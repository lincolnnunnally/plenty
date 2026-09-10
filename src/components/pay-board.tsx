import { isPayKind, payHint, payLabel, payQrTarget, payUrl, type PayKind } from "@/lib/pay";

export type PayRow = { kind: string; handle: string; posted?: boolean };

export function PayBoard({
  methods,
  empty
}: {
  methods: PayRow[];
  empty?: string;
}) {
  const posted = methods.filter((m) => isPayKind(m.kind) && (m.kind === "cash" || m.handle.trim()));
  if (!posted.length) {
    return (
      <p className="empty">
        {empty ||
          "Cash App, Venmo, and Zelle will show here once a pantry admin posts the real handles. We will not invent them."}
      </p>
    );
  }
  return (
    <div className="grid">
      {posted.map((row) => {
        const kind = row.kind as PayKind;
        const target = payQrTarget(kind, row.handle);
        const url = payUrl(kind, row.handle);
        return (
          <article className="card pay-card" key={kind}>
            <span>{payLabel(kind)}</span>
            <strong>{row.handle || "At the pantry"}</strong>
            {target ? (
              <img
                className="pay-qr"
                src={`/api/promote/qr?to=${encodeURIComponent(target)}&size=360`}
                alt={`${payLabel(kind)} QR code`}
                width={180}
                height={180}
              />
            ) : (
              <p className="note">Hand cash to the person running the line. No app needed.</p>
            )}
            {kind === "zelle" ? <p className="note">Open Zelle and send to this email or phone. {payHint(kind)}.</p> : null}
            {url ? (
              <a className="button primary" href={url}>
                Open {payLabel(kind)}
              </a>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
