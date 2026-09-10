import { appBrand } from "@/lib/app-brand";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/roles";

const NAV = [
  { href: "/need-food", label: "Need food" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/donate", label: "Give" },
  { href: "/become", label: "A path" },
  { href: "/run", label: "Run" },
  { href: "/account", label: "Account" }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);
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
            {user && canAccessAdmin(user.role) ? <a href="/run">Steward</a> : null}
            {user ? null : <a className="app-nav-cta" href="/sign-in">Join</a>}
          </nav>
        </div>
      </header>
      {children}
      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>&copy; {new Date().getFullYear()} {appBrand.name} · United Under God</span>
          <nav className="app-footer-nav" aria-label="Legal and site links">
            <a href="/">Home</a>
            <a href="/p/vidalia">Vidalia pantry</a>
            <a href="https://liveonmission.unitedundergod.org/">Live On Mission</a>
            <a href="https://neighborly.unitedundergod.org/">Neighborly</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
