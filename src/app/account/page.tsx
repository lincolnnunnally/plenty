import { requireCustomerAccess } from "@/lib/auth/session";
import { membershipsForUser } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireCustomerAccess("/account");
  const memberships = await membershipsForUser(user.id);

  return (
    <main className="shell">
      <p className="eyebrow">Account</p>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p className="note">App role: {user.role}. Pantry roles: {memberships.length ? memberships.map((m) => m.role).join(", ") : "none yet"}.</p>
      <form className="stack" action="/api/auth/signout" method="post">
        {/* next-auth v5 credentials sign-out via GET fallback */}
      </form>
      <a className="button" href="/api/auth/signout">Sign out</a>
    </main>
  );
}
