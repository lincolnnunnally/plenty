import { rolePermissions } from "./permissions";

export const roles = ["owner", "admin", "member"] as const;
export type Role = (typeof roles)[number];

const KNOWN_ROLES = new Set<string>(roles);

/** Super admin over the whole Plenty app — not a recipient, not a pantry volunteer. */
const HARDCODED_SUPER_ADMINS = ["lincoln@unitedundergod.org"];

export function superAdminEmails(): string[] {
  const extra = (process.env.PLENTY_SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...HARDCODED_SUPER_ADMINS, ...extra])];
}

export function isSuperAdminEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized && superAdminEmails().includes(normalized));
}

/** @deprecated Use isSuperAdminEmail. Kept so older call sites compile. */
export function isOwnerEmail(email?: string | null): boolean {
  return isSuperAdminEmail(email);
}

export function normalizeRole(value: unknown): Role | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return KNOWN_ROLES.has(normalized) ? (normalized as Role) : undefined;
}

export function roleForEmail(email?: string | null): Role {
  return isSuperAdminEmail(email) ? "owner" : "member";
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveRole(user: { id?: string | null; email?: string | null }): Promise<Role> {
  if (isSuperAdminEmail(user.email)) return "owner";
  const authUserId = typeof user.id === "string" && UUID_PATTERN.test(user.id) ? user.id : undefined;
  if (authUserId) {
    try {
      const { hasDatabase, getSupabase } = await import("@/lib/db/client");
      if (hasDatabase()) {
        const { data } = await getSupabase().from("plenty_user_profiles").select("role, email").eq("id", authUserId).maybeSingle();
        if (isSuperAdminEmail(data?.email) || isSuperAdminEmail(user.email)) return "owner";
        const role = normalizeRole(data?.role);
        if (role === "owner" || role === "admin") return "member";
        if (role) return role;
      }
    } catch {
      // fall through
    }
  }
  return "member";
}

/** App-level super admin only. Pantry desk uses isSteward (explicit pantry admin). */
export function canAccessAdmin(role?: string | null) {
  return role === "owner";
}

export function canAccessCustomerArea(role?: string | null) {
  return Boolean(role && KNOWN_ROLES.has(role));
}

export function permissionsForRole(role?: string | null) {
  return rolePermissions.find((entry) => entry.role === role)?.can || [];
}

export function membershipLabel(role: string) {
  switch (role) {
    case "neighbor":
      return "receiving food";
    case "volunteer":
      return "volunteer";
    case "donor":
      return "donor";
    case "steward":
    case "admin":
      return "pantry admin";
    default:
      return role;
  }
}
