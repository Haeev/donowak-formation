/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lnxqvlxvxnwxzwpbpnzs.supabase.co'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig 