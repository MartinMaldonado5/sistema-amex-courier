import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.126', '192.168.*.*', '10.*.*.*', 'localhost:3000'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-dcb2789e802043768fa5c6c649f9c405.r2.dev",
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
