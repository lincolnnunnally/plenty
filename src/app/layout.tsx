import "./styles.css";
import { AppShell } from "@/components/app-shell";
import { appBrand } from "@/lib/app-brand";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
        <Telemetry app="plenty" />
      </body>
    </html>
  );
}
