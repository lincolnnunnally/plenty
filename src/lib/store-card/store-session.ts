import { createHmac } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "plenty_store_desk";

function secret() {
  return process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "plenty-store-desk";
}

export function signStoreDesk(partnerId: string) {
  const sig = createHmac("sha256", secret()).update(partnerId).digest("hex").slice(0, 32);
  return `${partnerId}.${sig}`;
}

export function readStoreDeskToken(token: string): string | null {
  const [id, sig] = token.split(".");
  if (!id || !sig) return null;
  const expect = createHmac("sha256", secret()).update(id).digest("hex").slice(0, 32);
  if (expect.length !== sig.length) return null;
  let ok = 0;
  for (let i = 0; i < expect.length; i++) ok |= expect.charCodeAt(i) ^ sig.charCodeAt(i);
  return ok === 0 ? id : null;
}

export async function setStoreDeskCookie(partnerId: string) {
  const jar = await cookies();
  jar.set(COOKIE, signStoreDesk(partnerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/"
  });
}

export async function clearStoreDeskCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function storeDeskPartnerId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value || "";
  return token ? readStoreDeskToken(token) : null;
}
