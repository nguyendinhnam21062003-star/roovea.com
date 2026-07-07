import type { NextConfig } from "next"
import { networkInterfaces } from "node:os"

function getLocalDevOrigins() {
  return Object.values(networkInterfaces())
    .flatMap((items) => items ?? [])
    .filter((item) => item.family === "IPv4" && !item.internal)
    .map((item) => item.address)
}

const nextConfig: NextConfig = {
  allowedDevOrigins: Array.from(
    new Set(["192.168.1.3", ...getLocalDevOrigins()])
  ),
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
