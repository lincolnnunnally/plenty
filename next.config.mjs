import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

// Signed-in, steward desk and per-household pages stay out of search results.
// A household pass or store card code is a private key to that household.
const NOINDEX_PATHS = [
  "/account",
  "/app",
  "/run/:path*",
  "/serve",
  "/pass/:path*",
  "/s/:path*",
  "/donate/thanks",
  "/for-stores/manage",
  "/sign-in",
  "/sign-out"
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: { root },

  async headers() {
    return NOINDEX_PATHS.map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
    }));
  },

  async redirects() {
    return [
      { source: "/signup", destination: "/sign-in", permanent: false },
      { source: "/register", destination: "/sign-in", permanent: false },
      { source: "/login", destination: "/sign-in?mode=signin", permanent: false },
      { source: "/signin", destination: "/sign-in?mode=signin", permanent: false }
    ];
  }
};

export default nextConfig;
