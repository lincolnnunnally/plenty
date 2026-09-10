import { redirect } from "next/navigation";
import { auth, passwordSignInConfigured } from "@/auth";
import { hasDatabase } from "@/lib/db/client";
import { canAccessCustomerArea, isSuperAdminEmail, type Role } from "./roles";

export { toClientSession, type ClientSession } from "./client-session";

export type CurrentUser = { id: string; name: string; email: string; role: Role; mode: "session" | "setup" };

export function isAuthConfigured() {
  return hasDatabase() && Boolean(process.env.AUTH_SECRET) && passwordSignInConfigured();
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isAuthConfigured()) {
    if (process.env.NODE_ENV === "production") return null;
    const email = "lincoln@unitedundergod.org";
    return { id: "", name: "Local Setup User", email, role: "owner", mode: "setup" };
  }
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const role = isSuperAdminEmail(email) ? "owner" : ((session.user?.role as Role | undefined) ?? "member");
  return { id: session.user?.id ?? "", name: session.user?.name || email, email, role, mode: "session" };
}

export async function requireCustomerAccess(nextPath = "/app") {
  const user = await getCurrentUser();
  if (!user || !canAccessCustomerArea(user.role)) {
    redirect("/sign-in?next=" + encodeURIComponent(nextPath));
  }
  return user;
}

export async function requirePantryDesk(nextPath = "/run") {
  const user = await requireCustomerAccess(nextPath);
  const { getDefaultPantry, isSteward } = await import("@/lib/db/queries");
  const pantry = await getDefaultPantry();
  const superAdmin = isSuperAdminEmail(user.email);
  if (!pantry) {
    if (!superAdmin) redirect("/app");
    return { user, pantry: null, superAdmin: true };
  }
  if (!(await isSteward(pantry.id, user.id, user.email))) redirect("/app");
  return { user, pantry, superAdmin };
}
