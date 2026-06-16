import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  webpack: (config, { dev }) => {
    if (dev && process.platform === "win32") {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
