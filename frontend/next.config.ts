import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '08a7edb7f6eb264d84969fdd077c8aa5.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-32b76ab83d8e4d1787e427b8e5742a0b.r2.dev',
      },
    ],
  },
};

export default nextConfig;
