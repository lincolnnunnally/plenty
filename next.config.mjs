import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: { root },
  outputFileTracingIncludes: {
    "/*": ["./src/lib/db/**/*"]
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
