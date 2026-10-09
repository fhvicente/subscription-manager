import type { NextConfig } from "next";

const securityHeaders = [
    // No framing (clickjacking); no plugins; forms and <base> stay on this origin.
    {
        key: "Content-Security-Policy",
        value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Keeps query strings such as ?session_id= out of the Referer sent to other sites.
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // ponytail: no script-src yet; Next's inline scripts need nonces, add them if a full CSP is wanted.
    headers: async () => [{ source: "/:path*", headers: securityHeaders }],
};

export default nextConfig;
