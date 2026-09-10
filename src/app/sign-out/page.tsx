import { SignOutForm } from "@/components/sign-out-form";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignOutPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/");

  return (
    <main className="shell">
      <p className="eyebrow">Account</p>
      <h1>Sign out</h1>
      <p className="lede">You are signed in as {user.email}. Sign out to use a different account on this device.</p>
      <SignOutForm buttonClassName="button primary" />
    </main>
  );
}
