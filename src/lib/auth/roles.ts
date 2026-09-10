import { rolePermissions } from "./permissions";

export const roles = ["owner", "admin", "member"] as const;
export type Role = (typeof roles)[number];

const KNOWN_ROLES = new Set<string>(roles);

function ownerEmails(): string[] {
  return (process.env.APP_ENGINE_OWNER_EMAIL || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized && ownerEmails().includes(normalized));
}

export function normalizeRole(value: unknown): Role | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return KNOWN_ROLES.has(normalized) ? (normalized as Role) : undefined;
}

export function roleForEmail(email?: string | null): Role {
  return isOwnerEmail(email) ? "owner" : "member";
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveRole(user: { id?: string | null; email?: string | null }): Promise<Role> {
  if (isOwnerEmail(user.email)) return "owner";
  const authUserId = typeof user.id === "string" && UUID_PATTERN.test(user.id) ? user.id : undefined;
  if (authUserId) {
    try {
      const { hasDatabase, getDatabase } = await import("@/lib/db/client");
      if (hasDatabase()) {
        const sql = getDatabase();
        const rows = await sql<{ role?: unknown }>`select role from plenty_user_profiles where id = ${authUserId} limit 1`;
        const role = normalizeRole(rows[0]?.role);
        if (role) return role;
      }
    } catch {
      // fall through
    }
  }
  return "member";
}

export function canAccessAdmin(role?: string | null) {
  return role === "owner" || role === "admin";
}

export function canAccessCustomerArea(role?: string | null) {
  return Boolean(role && KNOWN_ROLES.has(role));
}

export function permissionsForRole(role?: string | null) {
  return rolePermissions.find((entry) => entry.role === role)?.can || [];
}
