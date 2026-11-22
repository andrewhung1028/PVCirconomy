import type { NextConfig } from 'next';
const config: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  redirects() {
    return [
      {
        source: '/PVCirconomy',
        destination: '/',
        permanent: true,
      },
      {
        source: '/PVCirconomy/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
};
export default config;
