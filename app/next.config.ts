import type { NextConfig } from "next";

// One Content-Security-Policy that covers both the Next app and the static
// marketing pages. 'unsafe-inline' is required because the app ships Next's
// inline hydration/streaming scripts and the static pages carry inline <style>
// blocks, inline style attributes, and the inline GA consent snippet; sources
// are otherwise pinned to the exact hosts the site actually loads.
//   - self ....................... app bundles, self-hosted next/font files
//   - *.supabase.co .............. profile photos, artifacts, auth/db/storage
//   - fonts.googleapis/gstatic ... Google Fonts used by the static pages
//   - googletagmanager/analytics . GA4 (cookieless)
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://*.analytics.google.com",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Belt-and-suspenders with frame-ancestors for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
      // The old static mockup is gone - send any stale links into the app.
      { source: "/app.html", destination: "/login", permanent: false },
    ];
  },
};

export default nextConfig;
