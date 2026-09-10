import { appBrand } from "@/lib/app-brand";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdminEmail } from "@/lib/auth/roles";
import { LangToggle } from "@/components/lang-toggle";
import { SignOutForm } from "@/components/sign-out-form";
import { getDefaultPantrySafe, isSteward, listStewardPantries } from "@/lib/db/queries";

const NAV = [
  { href: "/need-food", label: "Get food" },
  { href: "/around", label: "Around" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/for-stores", label: "Stores" },
  { href: "/donate", label: "Give" },
  { href: "/account", label: "Account" }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  let steward = Boolean(user && isSuperAdminEmail(user.email));
  if (user && !steward) {
    const mine = await listStewardPantries(user.id, user.email).catch(() => []);
    steward = mine.length > 0;
  }
  if (user && pantry && !steward) {
    steward = await isSteward(pantry.id, user.id, user.email).catch(() => false);
  }
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <a className="app-brand" href="/">
            <span className="app-logo-mark">{appBrand.monogram}</span>
            <span>{appBrand.name}</span>
          </a>
          <nav className="app-nav">
            {NAV.map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
            <LangToggle />
            {steward ? <a href="/run">Pantry desk</a> : null}
            {user ? (
              <SignOutForm buttonClassName="app-nav-signout" />
            ) : (
              <a className="app-nav-cta" href="/sign-in">Create an account</a>
            )}
          </nav>
        </div>
      </header>
      {children}
      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>Plenty food pantry · Vidalia, Georgia</span>
          <nav className="app-footer-nav" aria-label="Legal and site links">
            <a href="/">Home</a>
            <a href="/need-food">Get food</a>
            <a href="/volunteer">Volunteer</a>
            <a href="/donate">Give</a>
            <a href="/around">Around Toombs</a>
            <a href="/for-stores">For stores</a>
            <a href="/for-stores/manage">Store desk</a>
            <a href="/serve">Allied pantry</a>
            <a href="/waiver">Food agreement</a>
            <a href="/volunteer-waiver">Volunteer agreement</a>
            <a href="/tax-exempt">Tax-exempt info</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
