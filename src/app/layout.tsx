import "./styles.css";
import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { appBrand } from "@/lib/app-brand";
import { readLang } from "@/lib/i18n";
import { HOME_DESCRIPTION } from "@/lib/seo";
import { Telemetry } from "../lib/TelemetryProvider";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f1e6",
  colorScheme: "light"
};

export const metadata = {
  title: { default: "Plenty food pantry — Vidalia, Georgia", template: "%s — Plenty" },
  description: HOME_DESCRIPTION,
  keywords: [
    "Vidalia food pantry",
    "food pantry Vidalia Georgia",
    "free groceries Vidalia",
    "Toombs County food pantry",
    "help feeding my family Vidalia",
    "donate food Vidalia",
    "volunteer food pantry Vidalia"
  ],
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "Plenty food pantry — Vidalia, Georgia", description: HOME_DESCRIPTION, type: "website" },
  twitter: { card: "summary_large_image", title: appBrand.name, description: HOME_DESCRIPTION }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = readLang((await cookies()).get("plenty_lang")?.value);
  return (
    <html lang={lang}>
      <body>
        <AppShell>{children}</AppShell>
        <Telemetry app="plenty" />
      </body>
    </html>
  );
}
