import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // tsc --noEmit runs separately in CI; skip the redundant check during build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
