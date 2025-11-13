/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  output: "standalone", // Enable standalone output mode
  // Ensure standalone output includes required files
  outputFileTracingRoot: process.cwd(),
  distDir: '.next',
  // Server optimizations
  experimental: {
    // Memory optimizations (placeholder for future settings)
  },
  outputFileTracingIncludes: {
    '*': [
      'public/**/*',
      'prisma/**/*',
      'server.js',
      'package.json',
      'ecosystem.standalone.cjs',
    ],
  },
  // Optimize API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300', // 5 minute cache
          },
          {
            key: 'X-Response-Time',
            value: 'true',
          },
        ],
      },
    ];
  },

  // Allow CORS (for local testing)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
}

export default nextConfig;