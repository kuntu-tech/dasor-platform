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
  output: "standalone", // 添加 standalone 输出模式配置
  // 确保 standalone 输出包含必要文件
  outputFileTracingRoot: process.cwd(),
  distDir: '.next',
  // 优化服务器配置
  experimental: {
    // 优化内存使用
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
  // 优化API路由
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300', // 5分钟缓存
          },
          {
            key: 'X-Response-Time',
            value: 'true',
          },
        ],
      },
    ];
  },

  // 允许跨域（本地测试用）
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