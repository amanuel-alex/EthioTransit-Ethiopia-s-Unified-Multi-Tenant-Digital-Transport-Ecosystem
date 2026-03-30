import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Dev-only: hide build/static-route pills (Next still injects portals for error overlay). */
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
