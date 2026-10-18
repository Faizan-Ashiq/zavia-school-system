import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-expect-error - Next.js 16 removed eslint config from NextConfig
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;


