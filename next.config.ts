import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.3"],
  experimental: {
    cpus: 1,
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
}

export default nextConfig
