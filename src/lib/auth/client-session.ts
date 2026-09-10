import type { Role } from "./roles";

export type ClientSession = {
  user: { id?: string; name?: string | null; email?: string | null; image?: string | null; role?: Role };
  expires: string;
};

type SessionUserLike = { id?: string; name?: string | null; email?: string | null; image?: string | null; role?: Role };
type AdapterUserLike = { id?: string | number; email?: string | null };

export function toClientSession(
  session: { user?: SessionUserLike | null; expires: string },
  user?: AdapterUserLike | null
): ClientSession {
  const sessionUser = session.user ?? {};
  return {
    user: {
      id: sessionUser.id ?? (user?.id != null ? String(user.id) : undefined),
      name: sessionUser.name ?? null,
      email: sessionUser.email ?? user?.email ?? null,
      image: sessionUser.image ?? null,
      role: sessionUser.role
    },
    expires: session.expires
  };
}
