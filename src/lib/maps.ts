export type MapPlace = {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  hours?: string;
  status: "open" | "closed" | "unconfirmed";
  lat?: number | null;
  lon?: number | null;
};

export function placeQuery(place: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}) {
  return [place.address, place.city, place.state || "GA", place.zip].filter(Boolean).join(", ");
}

/** Opens turn-by-turn directions in Google Maps (iPhone offers Apple Maps too). */
export function mapsDirUrl(place: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  lat?: number | null;
  lon?: number | null;
}) {
  if (place.lat != null && place.lon != null && Number.isFinite(place.lat) && Number.isFinite(place.lon)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
  }
  const q = placeQuery(place);
  if (!q) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

export const TOOMBS_COORDS: Record<string, { lat: number; lon: number }> = {
  "vidaliachurchofgod": { lat: 32.216416, lon: -82.417518 },
  "godsstorehouse": { lat: 32.187831, lon: -82.408712 },
  "hisworksministryoutreachandfoodbank": { lat: 32.203209, lon: -82.31975 },
  "hisworksministryoutreachfoodbank": { lat: 32.203209, lon: -82.31975 },
  "lyonsfreewillbaptistchurchpantry": { lat: 32.196469, lon: -82.311428 },
  "lyonsfreewillbaptistchurchfoodpantry": { lat: 32.196469, lon: -82.311428 },
  "lyonsfreewillbaptistchurch": { lat: 32.196469, lon: -82.311428 },
  "concertedservicestoombscountyservicecenter": { lat: 32.203286, lon: -82.373271 },
  "southeastgeorgiacommunityprojects": { lat: 32.198511, lon: -82.320815 },
  "southeastgeorgiacommunitiesproject": { lat: 32.198511, lon: -82.320815 },
  "breadofheavenoutreach": { lat: 32.235071, lon: -82.401575 },
  "solomontabernaclebaptistchurch": { lat: 32.227602, lon: -82.409263 },
  "boysgirlscluboftoombscounty": { lat: 32.211105, lon: -82.404859 },
  "dotfoods": { lat: 32.223511, lon: -82.430865 },
  "dotfoodsvidaliadistributioncenter": { lat: 32.223511, lon: -82.430865 },
};

export function coordsForName(name: string) {
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return TOOMBS_COORDS[key] || null;
}
