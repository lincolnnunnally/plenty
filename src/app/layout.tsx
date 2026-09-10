import "./styles.css";
import { AppShell } from "@/components/app-shell";
import { appBrand } from "@/lib/app-brand";
import { Telemetry } from "../lib/TelemetryProvider";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f1e6",
  colorScheme: "light"
};

export const metadata = {
  title: { default: appBrand.name, template: "%s — " + appBrand.name },
  description: appBrand.tagline,
  icons: { icon: "/favicon.svg" },
  openGraph: { title: appBrand.name, description: appBrand.tagline, type: "website" },
  twitter: { card: "summary_large_image", title: appBrand.name, description: appBrand.tagline }
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
