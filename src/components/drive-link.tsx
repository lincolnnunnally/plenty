import { mapsDirUrl } from "@/lib/maps";

export function DriveLink({
  address,
  city,
  state,
  zip,
  lat,
  lon,
  label = "Drive"
}: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  lat?: number | null;
  lon?: number | null;
  label?: string;
}) {
  const href = mapsDirUrl({ address, city, state, zip, lat, lon });
  if (!href) return null;
  return (
    <a className="button leaf" href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}
