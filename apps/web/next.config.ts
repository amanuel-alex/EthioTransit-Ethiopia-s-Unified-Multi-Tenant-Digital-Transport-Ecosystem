import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ethiotransit/ui", "@ethiotransit/shared"],
};

export default nextConfig;
