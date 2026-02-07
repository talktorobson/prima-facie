/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/about', destination: '/sobre', permanent: true },
      { source: '/contact', destination: '/contato', permanent: true },
      { source: '/privacy', destination: '/politica-de-privacidade', permanent: true },
      { source: '/terms', destination: '/aviso-legal', permanent: true },
    ]
  },
}

module.exports = nextConfig
