import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // Serve the static marketing landing (public/index.html) at the root.
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      // The old static mockup is gone — send any stale links into the app.
      { source: "/app.html", destination: "/login", permanent: false },
    ];
  },
};

export default nextConfig;
