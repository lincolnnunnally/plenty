export const rolePermissions = [
  { role: "owner", can: ["super-admin the Plenty app", "grant pantry admins"] },
  { role: "admin", can: ["unused at app level — pantry desk is a membership"] },
  { role: "member", can: ["get food, volunteer, donate, walk a path"] }
] as const;

export const protectedRoutes = [
  { path: "/app", access: ["owner", "admin", "member"] },
  { path: "/account", access: ["owner", "admin", "member"] },
  { path: "/run", access: ["owner", "admin", "member"] }
] as const;
