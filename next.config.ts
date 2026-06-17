import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),  // Uncomment and add 'import path from "path"' if needed
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      // Redirect old /uploads/ and /images/defaults/ paths to /api/files/ route
      // This ensures existing database records with old paths still work
      {
        source: '/uploads/:path*',
        destination: '/api/files/uploads/:path*',
      },
      {
        source: '/images/defaults/:path*',
        destination: '/api/files/images/defaults/:path*',
      },
    ];
  },
};

export default nextConfig;
