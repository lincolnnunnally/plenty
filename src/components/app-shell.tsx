import { appBrand } from "@/lib/app-brand";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/roles";
import { getDefaultPantrySafe, isSteward } from "@/lib/db/queries";

const NAV = [
  { href: "/need-food", label: "Get food" },
  { href: "/this-week", label: "This week" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/donate", label: "Give" },
  { href: "/account", label: "Account" }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  let steward = Boolean(user && canAccessAdmin(user.role));
  if (user && pantry && !steward) {
    steward = await isSteward(pantry.id, user.id, user.role).catch(() => false);
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
            {steward ? <a href="/run">Pantry desk</a> : null}
            {user ? null : <a className="app-nav-cta" href="/sign-in">Create an account</a>}
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
            <a href="/tax-exempt">Tax-exempt info</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
