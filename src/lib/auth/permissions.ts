export const rolePermissions = [
  { role: "owner", can: ["run pantries", "manage app operations"] },
  { role: "admin", can: ["run pantries", "review people"] },
  { role: "member", can: ["visit, volunteer, donate, walk a path"] }
] as const;

export const protectedRoutes = [
  { path: "/app", access: ["owner", "admin", "member"] },
  { path: "/account", access: ["owner", "admin", "member"] },
  { path: "/run", access: ["owner", "admin", "member"] }
] as const;
