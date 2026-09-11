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
  async rewrites() {
    return [
      { source: '/dashboard', destination: '/' },
      { source: '/amex-excel', destination: '/' },
      { source: '/amex-excel/:path*', destination: '/' },
      { source: '/inventario', destination: '/' },
      { source: '/entregas', destination: '/' },
      { source: '/cobros', destination: '/' },
      { source: '/despacho', destination: '/' },
      { source: '/picking', destination: '/' },
      { source: '/escaner', destination: '/' },
      { source: '/matriz-dni', destination: '/' },
      { source: '/rotulos', destination: '/' },
      { source: '/boletas-shalom', destination: '/' },
      // Aliases para retrocompatibilidad
      { source: '/live-sheets', destination: '/' },
      { source: '/sheets', destination: '/' },
      { source: '/dni-matrix', destination: '/' },
      { source: '/rotulos-a4', destination: '/' },
      { source: '/mobile-scanner', destination: '/' },
      { source: '/wms-picking', destination: '/' },
      { source: '/fico-cobros', destination: '/' },
      { source: '/shp-entregas', destination: '/' },
      { source: '/shp-deliveries', destination: '/' },
      { source: '/mm-lince', destination: '/' },
      { source: '/mm-inventory', destination: '/' },
    ];
  },
};

export default nextConfig;
