/** @type {import('next').NextConfig} */
const nextConfig = {
  // unzipper pulls in an optional S3 backend we never use; keeping it out of
  // the server bundle avoids webpack trying (and failing) to resolve it.
  experimental: {
    serverComponentsExternalPackages: ["unzipper"],
  },
  // Dev-mode only: by default Next.js drops a route's compiled bundle after
  // ~60s of inactivity and recompiles on next visit, which reads as
  // "latency when switching tabs and back". Keep more pages warm, longer.
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 10,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "**.watchlist.local" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
