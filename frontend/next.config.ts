import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
