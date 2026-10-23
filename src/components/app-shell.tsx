import { cookies } from "next/headers";
import { appBrand } from "@/lib/app-brand";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdminEmail } from "@/lib/auth/roles";
import { readLang, t, type MsgKey } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";
import { SignOutForm } from "@/components/sign-out-form";
import { getDefaultPantrySafe, isSteward, listStewardPantries } from "@/lib/db/queries";

const NAV: { href: string; key: MsgKey }[] = [
  { href: "/need-food", key: "getFood" },
  { href: "/volunteer", key: "volunteer" },
  { href: "/for-stores", key: "navStores" },
  { href: "/donate", key: "give" },
  { href: "/around", key: "navAround" },
  { href: "/account", key: "account" }
];

const FOOTER: { titleKey: MsgKey; links: { href: string; key: MsgKey }[] }[] = [
  { titleKey: "footFood", links: [
    { href: "/need-food", key: "getFood" },
    { href: "/this-week", key: "thisWeek" },
    { href: "/become", key: "footMoreHelp" },
    { href: "/around", key: "navAround" },
    { href: "/serve", key: "footAllied" }
  ] },
  { titleKey: "footHelp", links: [
    { href: "/volunteer", key: "volunteer" },
    { href: "/donate", key: "give" },
    { href: "/for-stores", key: "footForStores" },
    { href: "/for-stores/manage", key: "footStoreDesk" }
  ] },
  { titleKey: "footPolicies", links: [
    { href: "/waiver", key: "footFoodAgreement" },
    { href: "/volunteer-waiver", key: "footVolAgreement" },
    { href: "/tax-exempt", key: "footTaxExempt" },
    { href: "/terms", key: "footTerms" },
    { href: "/privacy", key: "footPrivacy" }
  ] }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const lang = readLang((await cookies()).get("plenty_lang")?.value);
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
  const links = NAV.map((item) => (
    <a key={item.href} href={item.href}>{t(lang, item.key)}</a>
  ));
  const extras = (
    <>
      {steward ? <a href="/run">{t(lang, "navDesk")}</a> : null}
      {user ? (
        <SignOutForm buttonClassName="app-nav-signout" />
      ) : (
        <a className="app-nav-cta" href="/sign-in">{t(lang, "navCreateAccount")}</a>
      )}
    </>
  );
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <a className="app-brand" href="/">
            <img className="app-logo-img" src="/favicon.svg" alt="" width={36} height={36} />
            <span>{appBrand.name}</span>
          </a>
          <nav className="app-nav" aria-label="Main">
            {links}
            <LangToggle />
            {steward ? <a href="/run">{t(lang, "navDesk")}</a> : null}
            {user ? <SignOutForm buttonClassName="app-nav-signout" /> : null}
          </nav>
          <details className="app-drawer">
            <summary className="app-menu-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              {t(lang, "navMenu")}
            </summary>
            <nav className="app-drawer-panel" aria-label="Menu">
              {links}
              {extras}
              <LangToggle />
            </nav>
          </details>
        </div>
      </header>
      {children}
      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="app-footer-brand">
            <a className="app-brand" href="/">
              <img className="app-logo-img" src="/favicon.svg" alt="" width={36} height={36} />
              <span>{appBrand.name}</span>
            </a>
            <p>{t(lang, "footTagline")}</p>
          </div>
          {FOOTER.map((col) => (
            <nav className="app-footer-col" key={col.titleKey} aria-label={t(lang, col.titleKey)}>
              <h4>{t(lang, col.titleKey)}</h4>
              {col.links.map((l) => <a key={l.href} href={l.href}>{t(lang, l.key)}</a>)}
            </nav>
          ))}
        </div>
      </footer>
    </>
  );
}
