import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Silence Turbopack "multiple lockfiles" warning by explicitly declaring
  // this frontend/ folder as the workspace root.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Proxy all /api/v1/* requests to the NestJS backend.
  // Backend default port is 3000 — override via BACKEND_PORT env var if needed.
  async rewrites() {
    const backendPort = process.env.BACKEND_PORT ?? "3000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `http://localhost:${backendPort}/api/v1/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
